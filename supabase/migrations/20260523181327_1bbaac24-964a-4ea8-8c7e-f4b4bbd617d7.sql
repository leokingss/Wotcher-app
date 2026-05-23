-- The circle_members SELECT policy only lets the owner read their own
-- rows, which means a member cannot satisfy the EXISTS subquery used by
-- the stories visibility policy. Use a SECURITY DEFINER helper that
-- bypasses RLS to check membership safely.

CREATE OR REPLACE FUNCTION public.is_in_circle(
  _owner_id  uuid,
  _member_id uuid,
  _circle    public.friend_circle
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.circle_members cm
    WHERE cm.owner_id  = _owner_id
      AND cm.member_id = _member_id
      AND cm.circle    = _circle
  );
$$;

-- Lock down execution: only signed-in users need to call this from RLS.
REVOKE ALL ON FUNCTION public.is_in_circle(uuid, uuid, public.friend_circle) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_in_circle(uuid, uuid, public.friend_circle) TO authenticated;

-- Replace the stories policy so the membership check uses the helper.
DROP POLICY IF EXISTS "Active stories are viewable by audience" ON public.stories;

CREATE POLICY "Active stories are viewable by audience"
ON public.stories
FOR SELECT
USING (
  expires_at > now()
  AND (
    audience_circle IS NULL
    OR auth.uid() = user_id
    OR (
      auth.uid() IS NOT NULL
      AND public.is_in_circle(stories.user_id, auth.uid(), stories.audience_circle)
    )
  )
);