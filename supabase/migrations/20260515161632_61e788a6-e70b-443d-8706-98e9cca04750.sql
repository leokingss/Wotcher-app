CREATE OR REPLACE FUNCTION public.buy_listing(_listing_id uuid, _shipping jsonb)
RETURNS TABLE(seller_id uuid, title text, price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _buyer uuid := auth.uid();
  _row public.listings%ROWTYPE;
BEGIN
  IF _buyer IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO _row FROM public.listings WHERE id = _listing_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'listing not found'; END IF;
  IF _row.status <> 'active' THEN RAISE EXCEPTION 'listing not active'; END IF;
  IF _row.type <> 'fixed' THEN RAISE EXCEPTION 'not a fixed-price listing'; END IF;
  IF _row.seller_id = _buyer THEN RAISE EXCEPTION 'cannot buy your own listing'; END IF;

  UPDATE public.listings
  SET status = 'sold',
      current_bidder_id = _buyer,
      sold_at = now(),
      buyer_shipping = _shipping,
      updated_at = now()
  WHERE id = _listing_id;

  RETURN QUERY SELECT _row.seller_id, _row.title, _row.price;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.buy_listing(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.buy_listing(uuid, jsonb) TO authenticated;