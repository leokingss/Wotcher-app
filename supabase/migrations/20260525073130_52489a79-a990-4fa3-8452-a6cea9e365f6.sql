CREATE TABLE public.story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_url TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_story_highlights_user ON public.story_highlights(user_id, position);

ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Highlights are viewable by everyone"
ON public.story_highlights FOR SELECT USING (true);

CREATE POLICY "Owners can insert highlights"
ON public.story_highlights FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update highlights"
ON public.story_highlights FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete highlights"
ON public.story_highlights FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER trg_story_highlights_updated
BEFORE UPDATE ON public.story_highlights
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.story_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_story_id UUID,
  media_type public.story_media_type NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT,
  track_title TEXT,
  track_artist TEXT,
  filter_id TEXT,
  filter_intensity NUMERIC NOT NULL DEFAULT 1,
  stickers JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INT NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_highlight_items_highlight ON public.story_highlight_items(highlight_id, position);

ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Highlight items are viewable by everyone"
ON public.story_highlight_items FOR SELECT USING (true);

CREATE POLICY "Owners can insert highlight items"
ON public.story_highlight_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update highlight items"
ON public.story_highlight_items FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete highlight items"
ON public.story_highlight_items FOR DELETE TO authenticated
USING (auth.uid() = user_id);