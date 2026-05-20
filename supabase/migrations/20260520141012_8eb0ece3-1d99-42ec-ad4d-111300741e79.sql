
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS return_policy text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS fulfillment text NOT NULL DEFAULT 'shipping';

ALTER TABLE public.listings
  ADD CONSTRAINT listings_return_policy_check
    CHECK (return_policy IN ('none','14_days','30_days')),
  ADD CONSTRAINT listings_fulfillment_check
    CHECK (fulfillment IN ('shipping','pickup'));
