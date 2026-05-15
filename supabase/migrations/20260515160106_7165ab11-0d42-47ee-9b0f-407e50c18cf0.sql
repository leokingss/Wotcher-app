-- 1. Restrict buyer_shipping on listings: revoke direct column access from anon/authenticated,
-- expose via a security definer function only to seller and buyer.
REVOKE SELECT ON public.listings FROM anon, authenticated;
GRANT SELECT (
  id, title, type, seller_id, post_id, current_bid, current_bidder_id,
  starting_bid, price, description, status, shipping_required, sold_at,
  created_at, updated_at, ends_at
) ON public.listings TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_buyer_shipping(_listing_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.buyer_shipping
  FROM public.listings l
  WHERE l.id = _listing_id
    AND (l.seller_id = auth.uid() OR l.current_bidder_id = auth.uid())
$$;

REVOKE EXECUTE ON FUNCTION public.get_buyer_shipping(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_buyer_shipping(uuid) TO authenticated;

-- 2. Restrict listing_favorites SELECT to the owner only.
DROP POLICY IF EXISTS "favorites readable by all" ON public.listing_favorites;
CREATE POLICY "users read own favorites"
ON public.listing_favorites FOR SELECT
USING (auth.uid() = user_id);

-- 3. Tighten conversation_participants INSERT so users can only add themselves
-- to a brand-new conversation, or add others to a conversation they are already in.
DROP POLICY IF EXISTS "users insert own participation" ON public.conversation_participants;
CREATE POLICY "users insert own participation"
ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_conversation_participant(conversation_id, auth.uid())
);

-- 4. Require an artist account to create an artist_profiles row.
DROP POLICY IF EXISTS "users insert own artist profile" ON public.artist_profiles;
CREATE POLICY "users insert own artist profile"
ON public.artist_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_artist(auth.uid()));