-- Allow stories to be scoped to a specific friend circle of the owner.
-- NULL = public (everyone), otherwise only the owner + members of that
-- circle (resolved via circle_members) can SELECT the row while it is active.
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS audience_circle public.friend_circle NULL;

CREATE INDEX IF NOT EXISTS idx_stories_audience_circle
  ON public.stories (user_id, audience_circle)
  WHERE audience_circle IS NOT NULL;

-- Replace the public-read policy with a circle-aware one.
DROP POLICY IF EXISTS "Active stories are viewable by everyone" ON public.stories;

CREATE POLICY "Active stories are viewable by audience"
ON public.stories
FOR SELECT
USING (
  expires_at > now()
  AND (
    audience_circle IS NULL
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.circle_members cm
      WHERE cm.owner_id = stories.user_id
        AND cm.member_id = auth.uid()
        AND cm.circle = stories.audience_circle
    )
  )
);