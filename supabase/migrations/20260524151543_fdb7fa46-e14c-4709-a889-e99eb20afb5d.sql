-- Locations reference table (one row per unique provider place)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_place_id text NOT NULL,
  name text NOT NULL,
  formatted_address text,
  city text,
  region text,
  country text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  place_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_place_id)
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations readable by all"
  ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "authenticated users can insert locations"
  ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_locations_lat_lng ON public.locations (latitude, longitude);
CREATE INDEX idx_locations_city ON public.locations (city);

-- Add nullable location_id to existing content tables
ALTER TABLE public.posts     ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.videos    ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.stories   ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.listings  ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.profiles  ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_location_id    ON public.posts    (location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_videos_location_id   ON public.videos   (location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_stories_location_id  ON public.stories  (location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_listings_location_id ON public.listings (location_id) WHERE location_id IS NOT NULL;