
DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM ('listener', 'artist');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type public.account_type NOT NULL DEFAULT 'listener';

CREATE TABLE IF NOT EXISTS public.artist_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  external_link TEXT,
  bio TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artist profiles readable by all" ON public.artist_profiles FOR SELECT USING (true);
CREATE POLICY "users insert own artist profile" ON public.artist_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own artist profile" ON public.artist_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own artist profile" ON public.artist_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER artist_profiles_updated_at BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_artist(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND account_type = 'artist');
$$;

DO $$ BEGIN
  CREATE TYPE public.release_type AS ENUM ('single', 'ep', 'album');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration_seconds INT,
  release_type public.release_type NOT NULL DEFAULT 'single',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracks readable by all" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "artists insert own tracks" ON public.tracks FOR INSERT
  WITH CHECK (auth.uid() = artist_id AND public.is_artist(auth.uid()));
CREATE POLICY "artists update own tracks" ON public.tracks FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "artists delete own tracks" ON public.tracks FOR DELETE USING (auth.uid() = artist_id);

CREATE TRIGGER tracks_updated_at BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tracks_artist ON public.tracks(artist_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos readable by all" ON public.videos FOR SELECT USING (true);
CREATE POLICY "artists insert own videos" ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = artist_id AND public.is_artist(auth.uid()));
CREATE POLICY "artists update own videos" ON public.videos FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "artists delete own videos" ON public.videos FOR DELETE USING (auth.uid() = artist_id);

CREATE TRIGGER videos_updated_at BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_videos_artist ON public.videos(artist_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.track_saves (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  top10_rank INT CHECK (top10_rank BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_track_saves_unique_rank
  ON public.track_saves(user_id, top10_rank) WHERE top10_rank IS NOT NULL;

ALTER TABLE public.track_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "track saves readable by all" ON public.track_saves FOR SELECT USING (true);
CREATE POLICY "users insert own track saves" ON public.track_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own track saves" ON public.track_saves FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own track saves" ON public.track_saves FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.video_saves (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);
ALTER TABLE public.video_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video saves readable by all" ON public.video_saves FOR SELECT USING (true);
CREATE POLICY "users insert own video saves" ON public.video_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own video saves" ON public.video_saves FOR DELETE USING (auth.uid() = user_id);
