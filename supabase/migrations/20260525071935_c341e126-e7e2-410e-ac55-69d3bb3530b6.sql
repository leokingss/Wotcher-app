
CREATE TABLE public.story_question_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sticker_id text NOT NULL,
  user_id uuid NOT NULL,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sqr_story_sticker ON public.story_question_replies (story_id, sticker_id, created_at DESC);
CREATE INDEX idx_sqr_user ON public.story_question_replies (user_id);

ALTER TABLE public.story_question_replies ENABLE ROW LEVEL SECURITY;

-- Story owner can read all replies on their stories.
CREATE POLICY "story owners read replies"
  ON public.story_question_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_question_replies.story_id
      AND s.user_id = auth.uid()
  ));

-- Authors can read their own replies.
CREATE POLICY "users read own replies"
  ON public.story_question_replies FOR SELECT
  USING (auth.uid() = user_id);

-- Authors can submit replies.
CREATE POLICY "users insert own replies"
  ON public.story_question_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authors can delete their own reply.
CREATE POLICY "users delete own replies"
  ON public.story_question_replies FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.story_question_replies;
