
ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_order_shipped(
  _order_id uuid, _carrier text, _tracking_number text
) RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _row public.marketplace_orders;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _tracking_number IS NULL OR length(trim(_tracking_number)) = 0 THEN
    RAISE EXCEPTION 'tracking number required';
  END IF;
  UPDATE public.marketplace_orders
  SET status = 'shipped',
      carrier = _carrier,
      tracking_number = _tracking_number,
      shipped_at = now(),
      updated_at = now()
  WHERE id = _order_id
    AND seller_id = auth.uid()
    AND status = 'paid'
  RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found or not in paid state'; END IF;
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.mark_order_delivered(_order_id uuid)
RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _row public.marketplace_orders;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.marketplace_orders
  SET status = 'delivered',
      delivered_at = now(),
      updated_at = now()
  WHERE id = _order_id
    AND buyer_id = auth.uid()
    AND status = 'shipped'
  RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found or not in shipped state'; END IF;
  RETURN _row;
END $$;
