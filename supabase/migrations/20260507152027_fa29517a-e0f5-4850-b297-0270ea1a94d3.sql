
CREATE TYPE public.listing_type AS ENUM ('fixed', 'auction');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'ended', 'cancelled');

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  type public.listing_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  starting_bid NUMERIC(12,2),
  current_bid NUMERIC(12,2),
  current_bidder_id UUID,
  ends_at TIMESTAMPTZ,
  status public.listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_seller ON public.listings(seller_id);
CREATE INDEX idx_listings_post ON public.listings(post_id);
CREATE INDEX idx_listings_status ON public.listings(status);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings readable by all" ON public.listings FOR SELECT USING (true);
CREATE POLICY "sellers insert own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "sellers update own listings" ON public.listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "sellers delete own listings" ON public.listings FOR DELETE USING (auth.uid() = seller_id);

CREATE TRIGGER set_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bids_listing ON public.bids(listing_id);
CREATE INDEX idx_bids_bidder ON public.bids(bidder_id);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bids readable by all" ON public.bids FOR SELECT USING (true);
CREATE POLICY "users insert own bids" ON public.bids FOR INSERT WITH CHECK (
  auth.uid() = bidder_id
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_id
      AND l.type = 'auction'
      AND l.status = 'active'
      AND l.seller_id <> auth.uid()
      AND (l.ends_at IS NULL OR l.ends_at > now())
      AND amount > COALESCE(l.current_bid, l.starting_bid, 0)
  )
);

CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET current_bid = NEW.amount,
      current_bidder_id = NEW.bidder_id,
      updated_at = now()
  WHERE id = NEW.listing_id
    AND (current_bid IS NULL OR NEW.amount > current_bid);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_bid_insert
AFTER INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.handle_new_bid();
