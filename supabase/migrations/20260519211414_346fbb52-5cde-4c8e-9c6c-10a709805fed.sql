
-- Payout hold system: separate charges + manual transfers

-- 1. Configurable platform settings (hold period etc.)
CREATE TABLE IF NOT EXISTS public.payout_settings (
  id int PRIMARY KEY DEFAULT 1,
  hold_days int NOT NULL DEFAULT 7,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);
INSERT INTO public.payout_settings (id, hold_days) VALUES (1, 7) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.payout_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads payout settings" ON public.payout_settings FOR SELECT USING (true);
CREATE POLICY "admins update payout settings" ON public.payout_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Add payout_status + release timing to orders
ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'pending_release',
  ADD COLUMN IF NOT EXISTS release_after timestamptz,
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS payout_mode text NOT NULL DEFAULT 'separate';

-- Valid payout_status values: pending_release | held | released | refunded | disputed
ALTER TABLE public.marketplace_orders
  DROP CONSTRAINT IF EXISTS marketplace_orders_payout_status_check;
ALTER TABLE public.marketplace_orders
  ADD CONSTRAINT marketplace_orders_payout_status_check
  CHECK (payout_status IN ('pending_release','held','released','refunded','disputed'));

CREATE INDEX IF NOT EXISTS idx_orders_payout_eligible
  ON public.marketplace_orders (payout_status, release_after)
  WHERE payout_status = 'pending_release';

-- 3. Order payments ledger
CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('charge','transfer','refund','reversal','fee','adjustment')),
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  stripe_object_id text,
  status text,
  environment text NOT NULL DEFAULT 'sandbox',
  notes text,
  metadata jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_payments_order ON public.order_payments(order_id);
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buyer seller or admin read ledger" ON public.order_payments FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.marketplace_orders o
      WHERE o.id = order_payments.order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

-- 4. Update mark_order_delivered to set release_after
CREATE OR REPLACE FUNCTION public.mark_order_delivered(_order_id uuid)
RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _row public.marketplace_orders;
  _hold_days int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT hold_days INTO _hold_days FROM public.payout_settings WHERE id = 1;
  _hold_days := COALESCE(_hold_days, 7);

  UPDATE public.marketplace_orders
  SET status = 'delivered',
      delivered_at = now(),
      release_after = COALESCE(release_after, now() + make_interval(days => _hold_days)),
      updated_at = now()
  WHERE id = _order_id AND buyer_id = auth.uid() AND status = 'shipped'
  RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found or not in shipped state'; END IF;
  RETURN _row;
END $$;

-- 5. Admin actions (release / extend hold / mark disputed)
CREATE OR REPLACE FUNCTION public.admin_extend_hold(_order_id uuid, _extra_days int, _notes text)
RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _row public.marketplace_orders;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _extra_days IS NULL OR _extra_days <= 0 THEN RAISE EXCEPTION 'extra_days must be positive'; END IF;
  UPDATE public.marketplace_orders
  SET release_after = COALESCE(release_after, now()) + make_interval(days => _extra_days),
      payout_status = CASE WHEN payout_status IN ('pending_release','held') THEN 'held' ELSE payout_status END,
      updated_at = now()
  WHERE id = _order_id
  RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  INSERT INTO public.order_payments (order_id, entry_type, amount_cents, environment, notes, created_by, metadata)
  VALUES (_order_id, 'adjustment', 0, _row.environment,
          COALESCE(_notes, 'admin extended hold by ' || _extra_days || ' days'), auth.uid(),
          jsonb_build_object('extra_days', _extra_days));
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.admin_mark_disputed(_order_id uuid, _notes text)
RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _row public.marketplace_orders;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.marketplace_orders
  SET payout_status = 'disputed', disputed_at = COALESCE(disputed_at, now()), updated_at = now()
  WHERE id = _order_id RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;

  INSERT INTO public.disputes (order_id, buyer_id, seller_id, source, reason, details)
  SELECT _row.id, _row.buyer_id, _row.seller_id, 'admin', 'admin_flag', _notes
  WHERE NOT EXISTS (SELECT 1 FROM public.disputes WHERE order_id = _row.id AND status = 'open');

  INSERT INTO public.order_payments (order_id, entry_type, amount_cents, environment, notes, created_by)
  VALUES (_order_id, 'adjustment', 0, _row.environment, COALESCE(_notes,'admin marked disputed'), auth.uid());
  RETURN _row;
END $$;

-- Mark released after a transfer (called by edge function via service role)
CREATE OR REPLACE FUNCTION public.mark_order_released(
  _order_id uuid, _transfer_id text, _amount_cents int
) RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _row public.marketplace_orders;
BEGIN
  UPDATE public.marketplace_orders
  SET payout_status = 'released',
      released_at = now(),
      stripe_transfer_id = _transfer_id,
      updated_at = now()
  WHERE id = _order_id AND payout_status IN ('pending_release','held')
  RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not eligible for release'; END IF;
  INSERT INTO public.order_payments (order_id, entry_type, amount_cents, currency, stripe_object_id, environment, notes)
  VALUES (_order_id, 'transfer', _amount_cents, _row.currency, _transfer_id, _row.environment, 'seller payout');
  RETURN _row;
END $$;

-- Update mark_order_refunded to also set payout_status
CREATE OR REPLACE FUNCTION public.mark_order_refunded(_order_id uuid, _amount_cents int, _reason text)
RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _row public.marketplace_orders;
BEGIN
  UPDATE public.marketplace_orders
  SET status = 'refunded',
      payout_status = 'refunded',
      refunded_at = now(),
      refund_amount_cents = _amount_cents,
      refund_reason = _reason,
      updated_at = now()
  WHERE id = _order_id RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;

  UPDATE public.disputes SET status='refunded', resolved_at=now(), updated_at=now()
  WHERE order_id=_order_id AND status='open';

  INSERT INTO public.order_payments (order_id, entry_type, amount_cents, currency, environment, notes)
  VALUES (_order_id, 'refund', _amount_cents, _row.currency, _row.environment, COALESCE(_reason,'refund'));
  RETURN _row;
END $$;
