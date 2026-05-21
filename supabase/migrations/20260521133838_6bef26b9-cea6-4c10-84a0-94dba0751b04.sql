
-- 1) Restrict seller_trust_scores SELECT to owner + staff
DROP POLICY IF EXISTS "trust scores readable" ON public.seller_trust_scores;
CREATE POLICY "seller trust scores: owner or staff read"
ON public.seller_trust_scores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- 2) Harden notifications insert: actor can only insert for themselves OR notifying themselves
DROP POLICY IF EXISTS "actors insert notifications" ON public.notifications;
CREATE POLICY "actors insert notifications: self-only"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = actor_id
  AND auth.uid() = user_id
);

-- 3) Lock down Realtime: only allow authenticated subscribes to user-scoped topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read own realtime channels" ON realtime.messages;
CREATE POLICY "authenticated can read own realtime channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING ( auth.uid() IS NOT NULL );
