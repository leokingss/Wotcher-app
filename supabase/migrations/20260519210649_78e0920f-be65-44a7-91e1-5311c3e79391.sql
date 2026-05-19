
ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_amount_cents integer,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS disputed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'buyer', -- buyer | stripe
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',   -- open | resolved | refunded | rejected
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  stripe_dispute_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS disputes_order_idx ON public.disputes(order_id);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer seller or admin read disputes"
  ON public.disputes FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins manage disputes"
  ON public.disputes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.open_dispute(_order_id uuid, _reason text, _details text)
RETURNS public.disputes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _o public.marketplace_orders; _d public.disputes;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN RAISE EXCEPTION 'reason required'; END IF;

  SELECT * INTO _o FROM public.marketplace_orders WHERE id = _order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF _o.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'only the buyer can open a dispute'; END IF;
  IF _o.status NOT IN ('paid','shipped','delivered') THEN
    RAISE EXCEPTION 'order is not eligible for dispute';
  END IF;
  IF _o.paid_at IS NOT NULL AND _o.paid_at < now() - interval '30 days' THEN
    RAISE EXCEPTION 'dispute window has closed (30 days)';
  END IF;
  IF EXISTS (SELECT 1 FROM public.disputes WHERE order_id = _order_id AND status = 'open') THEN
    RAISE EXCEPTION 'a dispute is already open for this order';
  END IF;

  INSERT INTO public.disputes (order_id, buyer_id, seller_id, source, reason, details)
  VALUES (_order_id, _o.buyer_id, _o.seller_id, 'buyer', _reason, _details)
  RETURNING * INTO _d;

  UPDATE public.marketplace_orders
  SET disputed_at = now(), updated_at = now()
  WHERE id = _order_id;

  RETURN _d;
END $$;

CREATE OR REPLACE FUNCTION public.mark_order_refunded(
  _order_id uuid, _amount_cents integer, _reason text
) RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _row public.marketplace_orders;
BEGIN
  UPDATE public.marketplace_orders
  SET status = 'refunded',
      refunded_at = now(),
      refund_amount_cents = _amount_cents,
      refund_reason = _reason,
      updated_at = now()
  WHERE id = _order_id
  RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;

  UPDATE public.disputes
  SET status = 'refunded', resolved_at = now(), updated_at = now()
  WHERE order_id = _order_id AND status = 'open';

  RETURN _row;
END $$;
