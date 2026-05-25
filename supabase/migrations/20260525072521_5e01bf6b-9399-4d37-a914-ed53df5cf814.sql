
CREATE TABLE public.story_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX idx_story_reactions_story ON public.story_reactions (story_id, emoji);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story owners read all reactions"
  ON public.story_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_reactions.story_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "users read own reaction"
  ON public.story_reactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own reaction"
  ON public.story_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own reaction"
  ON public.story_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own reaction"
  ON public.story_reactions FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
