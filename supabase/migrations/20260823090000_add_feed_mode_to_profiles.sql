-- Let each user pick their own feed algorithm and have the choice stick.
-- "Others decide what you see. We let you decide."

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feed_mode text NOT NULL DEFAULT 'live';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_feed_mode_check
  CHECK (feed_mode IN ('live', 'popular', 'algorithm'));
