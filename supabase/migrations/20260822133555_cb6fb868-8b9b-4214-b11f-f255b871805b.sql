DO $$
DECLARE r record;
  policy_helpers text[] := ARRAY['can_bid','can_view_list','has_role','is_artist','is_conversation_participant','is_in_circle','is_list_owner','is_staff'];
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
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    IF NOT (r.proname = ANY(internal)) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END IF;
    IF r.proname = ANY(policy_helpers) OR r.proname = 'validate_invite_code' THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', r.sig);
    END IF;
  END LOOP;
END $$;