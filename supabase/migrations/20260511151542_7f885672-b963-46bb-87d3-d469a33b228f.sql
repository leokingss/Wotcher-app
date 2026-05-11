CREATE TABLE public.listing_favorites (
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX idx_listing_favorites_user ON public.listing_favorites(user_id, created_at DESC);
CREATE INDEX idx_listing_favorites_listing ON public.listing_favorites(listing_id);

ALTER TABLE public.listing_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites readable by all"
  ON public.listing_favorites FOR SELECT USING (true);

CREATE POLICY "users insert own favorites"
  ON public.listing_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own favorites"
  ON public.listing_favorites FOR DELETE
  USING (auth.uid() = user_id);