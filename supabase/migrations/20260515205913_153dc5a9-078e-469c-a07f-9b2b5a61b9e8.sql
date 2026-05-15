-- 1. Hide buyer_shipping column from public reads
REVOKE SELECT (buyer_shipping) ON public.listings FROM anon, authenticated;

-- 2. Tighten artist_profiles UPDATE to require artist role
DROP POLICY IF EXISTS "users update own artist profile" ON public.artist_profiles;
CREATE POLICY "users update own artist profile"
ON public.artist_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_artist(auth.uid()))
WITH CHECK (auth.uid() = user_id AND public.is_artist(auth.uid()));