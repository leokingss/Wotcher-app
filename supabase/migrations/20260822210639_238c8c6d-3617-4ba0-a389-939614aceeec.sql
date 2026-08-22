ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS feed_mode text NOT NULL DEFAULT 'live';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_feed_mode_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_feed_mode_check CHECK (feed_mode IN ('live','popular','algorithm'));