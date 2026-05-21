
-- ============================================
-- STORIES
-- ============================================
CREATE TYPE public.story_media_type AS ENUM ('photo', 'video', 'music');

CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type public.story_media_type NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT,
  track_title TEXT,
  track_artist TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active stories are viewable by everyone"
ON public.stories FOR SELECT
USING (expires_at > now());

CREATE POLICY "Users can insert their own stories"
ON public.stories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
ON public.stories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.stories FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Story views tracking (who has seen which story)
CREATE TABLE public.story_views (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story owners can see who viewed"
ON public.story_views FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid())
  OR viewer_id = auth.uid()
);

CREATE POLICY "Users can insert their own views"
ON public.story_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id);

-- Cleanup function (call manually or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n integer;
BEGIN
  WITH d AS (DELETE FROM public.stories WHERE expires_at < now() RETURNING 1)
  SELECT COUNT(*) INTO _n FROM d;
  RETURN _n;
END $$;

-- ============================================
-- FRIEND CIRCLES
-- ============================================
CREATE TYPE public.friend_circle AS ENUM ('private', 'family', 'friends', 'groups');

CREATE TABLE public.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  circle public.friend_circle NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, member_id, circle),
  CHECK (owner_id <> member_id)
);

CREATE INDEX idx_circle_members_owner ON public.circle_members(owner_id, circle);
CREATE INDEX idx_circle_members_member ON public.circle_members(member_id);

ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their circle members"
ON public.circle_members FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can add circle members"
ON public.circle_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can remove circle members"
ON public.circle_members FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
