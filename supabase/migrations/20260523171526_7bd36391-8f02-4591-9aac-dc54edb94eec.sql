-- Fix search_path on pgmq helper functions
CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END; $$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END; $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END; $$;

-- Tighten overly-permissive conversations INSERT policy.
-- Conversations are created exclusively via the get_or_create_dm SECURITY DEFINER RPC,
-- so direct INSERTs from clients are not needed.
DROP POLICY IF EXISTS "authenticated insert conversations" ON public.conversations;

-- Revoke EXECUTE on internal/admin SECURITY DEFINER RPCs from anon to silence linter 0028
REVOKE EXECUTE ON FUNCTION public.resolve_report(uuid,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_extra_invites(uuid,integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recompute_trust_score(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_invite(text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_invite(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.open_dispute(uuid,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_bidder_registration(numeric,text,date,text,text,text,text,text,text,text,text,text,text,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.buy_listing(uuid,jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_order_refunded(uuid,integer,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_order_delivered(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_order_released(uuid,text,integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_order_shipped(uuid,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.flag_account(uuid,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.clear_account_flag(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.suspend_seller(uuid,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lift_seller_suspension(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_listing(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.warn_seller(uuid,text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_mark_disputed(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_extend_hold(uuid,integer,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_dm(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text,integer,integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text,bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text,jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text,text,bigint,jsonb) FROM anon, authenticated;