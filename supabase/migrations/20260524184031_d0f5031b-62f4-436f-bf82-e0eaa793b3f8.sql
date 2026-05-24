
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS filter_id text,
  ADD COLUMN IF NOT EXISTS filter_intensity smallint NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS overlays_json jsonb;

CREATE TABLE IF NOT EXISTS public.user_favorite_filters (
  user_id uuid NOT NULL,
  filter_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, filter_id)
);

ALTER TABLE public.user_favorite_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own favorite filters"
  ON public.user_favorite_filters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own favorite filters"
  ON public.user_favorite_filters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own favorite filters"
  ON public.user_favorite_filters FOR DELETE
  USING (auth.uid() = user_id);
