
-- 1) Make post_id nullable and add polymorphic target columns
ALTER TABLE public.comments ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS track_id uuid;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS video_id uuid;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS voice_url text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS voice_duration_seconds integer;

-- 2) Ensure exactly one target is set per comment
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_one_target;
ALTER TABLE public.comments ADD CONSTRAINT comments_one_target CHECK (
  ((post_id IS NOT NULL)::int + (track_id IS NOT NULL)::int + (video_id IS NOT NULL)::int) = 1
);

CREATE INDEX IF NOT EXISTS comments_track_id_idx ON public.comments(track_id) WHERE track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comments_video_id_idx ON public.comments(video_id) WHERE video_id IS NOT NULL;

-- 3) Voice notes storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Voice notes are publicly readable" ON storage.objects;
CREATE POLICY "Voice notes are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "Users upload own voice notes" ON storage.objects;
CREATE POLICY "Users upload own voice notes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own voice notes" ON storage.objects;
CREATE POLICY "Users update own voice notes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own voice notes" ON storage.objects;
CREATE POLICY "Users delete own voice notes"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);
