
-- Extend notification types
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'outbid';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'auction_won';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'item_sold';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'auction_ending';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_listing';

-- Listings: track sale time + shipping snapshot
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS sold_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS buyer_shipping jsonb;

-- Notifications: extend with optional listing reference + metadata
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS listing_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Default shipping address per user
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  region text,
  postal_code text NOT NULL,
  country text NOT NULL,
  phone text,
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own addresses" ON public.shipping_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own addresses" ON public.shipping_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own addresses" ON public.shipping_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own addresses" ON public.shipping_addresses FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_shipping_addresses_updated_at BEFORE UPDATE ON public.shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seller reviews
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews readable by all" ON public.seller_reviews FOR SELECT USING (true);
CREATE POLICY "buyers insert own review"
  ON public.seller_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.status = 'sold'
        AND l.current_bidder_id = auth.uid()
        AND l.seller_id = seller_reviews.seller_id
    )
  );
CREATE POLICY "buyers update own review" ON public.seller_reviews FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "buyers delete own review" ON public.seller_reviews FOR DELETE USING (auth.uid() = buyer_id);

-- Blocks
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "users insert own blocks" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "users delete own blocks" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post','user','comment','listing')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "users insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Trigger: notify previous bidder when outbid
CREATE OR REPLACE FUNCTION public.notify_outbid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _prev_bidder uuid; _seller uuid;
BEGIN
  SELECT current_bidder_id, seller_id INTO _prev_bidder, _seller
  FROM public.listings WHERE id = NEW.listing_id;
  IF _prev_bidder IS NOT NULL AND _prev_bidder <> NEW.bidder_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, listing_id, metadata)
    VALUES (_prev_bidder, NEW.bidder_id, 'outbid', NEW.listing_id, jsonb_build_object('amount', NEW.amount));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_outbid ON public.bids;
CREATE TRIGGER trg_notify_outbid
  BEFORE INSERT ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.notify_outbid();

-- Update existing handle_new_bid to fire after the outbid notification (it's a separate trigger, order is fine)

-- Trigger: notify followers when seller creates a new listing
CREATE OR REPLACE FUNCTION public.notify_followers_new_listing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, listing_id)
  SELECT f.follower_id, NEW.seller_id, 'new_listing', NEW.id
  FROM public.follows f
  WHERE f.following_id = NEW.seller_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_followers_new_listing ON public.listings;
CREATE TRIGGER trg_notify_followers_new_listing
  AFTER INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_listing();

-- Helper: aggregate seller rating view
CREATE OR REPLACE VIEW public.seller_rating_summary AS
SELECT seller_id,
       ROUND(AVG(rating)::numeric, 2) AS avg_rating,
       COUNT(*)::int AS review_count
FROM public.seller_reviews
GROUP BY seller_id;
