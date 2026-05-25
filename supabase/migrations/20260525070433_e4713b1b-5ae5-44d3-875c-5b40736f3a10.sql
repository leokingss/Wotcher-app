-- Phase 4: interactive story stickers
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS stickers jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Poll votes: each user can vote once per (story, sticker)
CREATE TABLE IF NOT EXISTS public.story_poll_votes (
  story_id uuid NOT NULL,
  sticker_id text NOT NULL,
  user_id uuid NOT NULL,
  option_index smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, sticker_id, user_id)
);

ALTER TABLE public.story_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll votes readable by all"
  ON public.story_poll_votes FOR SELECT USING (true);

CREATE POLICY "users insert own poll votes"
  ON public.story_poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own poll votes"
  ON public.story_poll_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own poll votes"
  ON public.story_poll_votes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_story_poll_votes_sticker
  ON public.story_poll_votes (story_id, sticker_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.story_poll_votes;