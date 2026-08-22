-- 1. bids: signed-in only
DROP POLICY IF EXISTS "bids readable by all" ON public.bids;
CREATE POLICY "bids readable by authenticated" ON public.bids FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.bids FROM anon;

-- 2. drop_claims
DROP POLICY IF EXISTS drop_claims_public_read ON public.drop_claims;
CREATE POLICY drop_claims_auth_read ON public.drop_claims FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.drop_claims FROM anon;

-- 3. group_buy_members
DROP POLICY IF EXISTS gbm_public_read ON public.group_buy_members;
CREATE POLICY gbm_auth_read ON public.group_buy_members FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.group_buy_members FROM anon;

-- 4. live_chat
DROP POLICY IF EXISTS live_chat_public_read ON public.live_chat;
CREATE POLICY live_chat_auth_read ON public.live_chat FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.live_chat FROM anon;

-- 5. packet_shares: only packet creator may insert shares
DROP POLICY IF EXISTS ps_auth_insert ON public.packet_shares;
CREATE POLICY ps_creator_insert ON public.packet_shares FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.red_packets rp WHERE rp.id = packet_id AND rp.creator_id = auth.uid()));
DROP POLICY IF EXISTS ps_public_read ON public.packet_shares;
CREATE POLICY ps_auth_read ON public.packet_shares FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.packet_shares FROM anon;

-- 6. story_poll_votes: only story owner or the voter can read individual votes
DROP POLICY IF EXISTS "poll votes readable by all" ON public.story_poll_votes;
CREATE POLICY "poll votes readable by owner or voter" ON public.story_poll_votes FOR SELECT TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid()));
REVOKE SELECT ON public.story_poll_votes FROM anon;

-- 7. predict_scores
DROP POLICY IF EXISTS predict_scores_public_read ON public.predict_scores;
CREATE POLICY predict_scores_auth_read ON public.predict_scores FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.predict_scores FROM anon;

-- 8. Lock down SECURITY DEFINER functions that must never be called from the client
DO $$
DECLARE r record;
  internal text[] := ARRAY[
    'email_queue_dispatch','email_queue_wake','enqueue_email','delete_email','read_email_batch','move_to_dlq',
    'generate_invite_code','cleanup_expired_stories','handle_new_bid','handle_new_message','handle_new_user',
    'notify_comment','notify_follow','notify_followers_new_listing','notify_outbid','notify_post_reaction',
    'notify_story_mentions','mark_order_refunded','mark_order_released','recompute_trust_score','set_updated_at',
    'admin_extend_hold','admin_mark_disputed','clear_account_flag','flag_account','grant_extra_invites',
    'lift_seller_suspension','remove_listing','resolve_report','suspend_seller','warn_seller','claim_invite'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    -- anon should not execute any security definer function except public invite validation
    IF r.proname <> 'validate_invite_code' THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    END IF;
    IF r.proname = ANY(internal) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', r.sig);
    END IF;
  END LOOP;
END $$;