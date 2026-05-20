
-- profiles: invite allowance
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invite_allowance integer NOT NULL DEFAULT 17;

-- invites
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  inviter_user_id uuid NOT NULL,
  invitee_user_id uuid,
  invitee_email text,
  invitee_phone text,
  invite_type text NOT NULL CHECK (invite_type IN ('email','sms','share_link')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','claimed','used','expired','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  revoked_at timestamptz,
  revoked_by uuid,
  metadata jsonb
);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON public.invites(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invites_phone ON public.invites(invitee_phone);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own invites" ON public.invites FOR SELECT
  USING (auth.uid() = inviter_user_id OR auth.uid() = invitee_user_id OR is_staff(auth.uid()));

CREATE POLICY "admins manage invites" ON public.invites FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- invite_events
CREATE TABLE IF NOT EXISTS public.invite_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.invites(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid,
  ip text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invite_events_invite ON public.invite_events(invite_id);

ALTER TABLE public.invite_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner or admin read invite events" ON public.invite_events FOR SELECT
  USING (
    is_staff(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.invites i
      WHERE i.id = invite_events.invite_id
        AND (i.inviter_user_id = auth.uid() OR i.invitee_user_id = auth.uid())
    )
  );

-- referral_relationships
CREATE TABLE IF NOT EXISTS public.referral_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id uuid NOT NULL,
  invitee_user_id uuid NOT NULL UNIQUE,
  invite_id uuid NOT NULL REFERENCES public.invites(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON public.referral_relationships(inviter_user_id);

ALTER TABLE public.referral_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own referrals" ON public.referral_relationships FOR SELECT
  USING (auth.uid() = inviter_user_id OR auth.uid() = invitee_user_id OR is_staff(auth.uid()));

-- Code generator: 10-char crockford-ish base32
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
  code text;
  i int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..10 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invites WHERE invites.code = code);
  END LOOP;
  RETURN code;
END $$;

-- Remaining invites for a user
CREATE OR REPLACE FUNCTION public.invites_remaining(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT GREATEST(
    0,
    COALESCE((SELECT invite_allowance FROM public.profiles WHERE id = _user_id), 17)
    - COALESCE((SELECT COUNT(*) FROM public.invites WHERE inviter_user_id = _user_id AND status = 'used'), 0)
  )::int
$$;

-- Create invite
CREATE OR REPLACE FUNCTION public.create_invite(
  _invite_type text,
  _invitee_email text DEFAULT NULL,
  _invitee_phone text DEFAULT NULL
) RETURNS public.invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.invites;
  _pending int;
  _remaining int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _invite_type NOT IN ('email','sms','share_link') THEN
    RAISE EXCEPTION 'invalid invite_type';
  END IF;
  IF _invite_type = 'email' AND (_invitee_email IS NULL OR length(trim(_invitee_email)) = 0) THEN
    RAISE EXCEPTION 'email required';
  END IF;
  IF _invite_type = 'sms' AND (_invitee_phone IS NULL OR length(trim(_invitee_phone)) = 0) THEN
    RAISE EXCEPTION 'phone required';
  END IF;

  -- expire stale pending invites first
  UPDATE public.invites SET status = 'expired'
   WHERE inviter_user_id = _uid AND status IN ('pending','claimed') AND expires_at < now();

  SELECT public.invites_remaining(_uid) INTO _remaining;
  IF _remaining <= 0 THEN
    RAISE EXCEPTION 'no invites remaining';
  END IF;

  SELECT COUNT(*) INTO _pending FROM public.invites
   WHERE inviter_user_id = _uid AND status IN ('pending','claimed');
  IF _pending >= 50 THEN
    RAISE EXCEPTION 'too many pending invites (max 50)';
  END IF;

  -- prevent duplicate active invite for same email/phone by same inviter
  IF _invitee_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.invites
    WHERE inviter_user_id = _uid AND invitee_email = lower(_invitee_email)
      AND status IN ('pending','claimed')
  ) THEN
    RAISE EXCEPTION 'an active invite already exists for that email';
  END IF;
  IF _invitee_phone IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.invites
    WHERE inviter_user_id = _uid AND invitee_phone = _invitee_phone
      AND status IN ('pending','claimed')
  ) THEN
    RAISE EXCEPTION 'an active invite already exists for that phone';
  END IF;

  INSERT INTO public.invites (code, inviter_user_id, invitee_email, invitee_phone, invite_type)
  VALUES (
    public.generate_invite_code(),
    _uid,
    CASE WHEN _invitee_email IS NULL THEN NULL ELSE lower(trim(_invitee_email)) END,
    CASE WHEN _invitee_phone IS NULL THEN NULL ELSE trim(_invitee_phone) END,
    _invite_type
  ) RETURNING * INTO _row;

  INSERT INTO public.invite_events (invite_id, event_type, actor_id)
  VALUES (_row.id, 'created', _uid);
  RETURN _row;
END $$;

-- Validate an invite code (public; safe info only)
CREATE OR REPLACE FUNCTION public.validate_invite_code(
  _code text,
  _email text DEFAULT NULL,
  _phone text DEFAULT NULL
) RETURNS TABLE(valid boolean, reason text, inviter_username text, invite_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _i public.invites; _u text;
BEGIN
  SELECT * INTO _i FROM public.invites WHERE upper(code) = upper(_code);
  IF NOT FOUND THEN RETURN QUERY SELECT false, 'not_found'::text, NULL::text, NULL::uuid; RETURN; END IF;
  IF _i.status = 'revoked' THEN RETURN QUERY SELECT false, 'revoked'::text, NULL::text, _i.id; RETURN; END IF;
  IF _i.status = 'used' THEN RETURN QUERY SELECT false, 'used'::text, NULL::text, _i.id; RETURN; END IF;
  IF _i.expires_at < now() THEN RETURN QUERY SELECT false, 'expired'::text, NULL::text, _i.id; RETURN; END IF;
  IF _i.invitee_email IS NOT NULL AND _email IS NOT NULL AND lower(trim(_email)) <> _i.invitee_email THEN
    RETURN QUERY SELECT false, 'email_mismatch'::text, NULL::text, _i.id; RETURN;
  END IF;
  IF _i.invitee_phone IS NOT NULL AND _phone IS NOT NULL AND trim(_phone) <> _i.invitee_phone THEN
    RETURN QUERY SELECT false, 'phone_mismatch'::text, NULL::text, _i.id; RETURN;
  END IF;
  SELECT username INTO _u FROM public.profiles WHERE id = _i.inviter_user_id;
  RETURN QUERY SELECT true, 'ok'::text, _u, _i.id;
END $$;

GRANT EXECUTE ON FUNCTION public.validate_invite_code(text, text, text) TO anon, authenticated;

-- Consume invite once the calling user is verified
CREATE OR REPLACE FUNCTION public.consume_invite(_code text)
RETURNS public.invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _i public.invites;
  _confirmed timestamptz;
  _email text;
  _phone text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT email_confirmed_at, email, phone INTO _confirmed, _email, _phone
    FROM auth.users WHERE id = _uid;
  IF _confirmed IS NULL THEN
    RAISE EXCEPTION 'email not verified';
  END IF;

  SELECT * INTO _i FROM public.invites WHERE upper(code) = upper(_code) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite not found'; END IF;
  IF _i.status = 'used' THEN
    IF _i.invitee_user_id = _uid THEN RETURN _i; END IF;
    RAISE EXCEPTION 'invite already used';
  END IF;
  IF _i.status = 'revoked' THEN RAISE EXCEPTION 'invite revoked'; END IF;
  IF _i.expires_at < now() THEN RAISE EXCEPTION 'invite expired'; END IF;
  IF _i.inviter_user_id = _uid THEN RAISE EXCEPTION 'cannot use your own invite'; END IF;
  IF _i.invitee_email IS NOT NULL AND lower(_email) <> _i.invitee_email THEN
    RAISE EXCEPTION 'invite is locked to a different email';
  END IF;
  IF _i.invitee_phone IS NOT NULL AND _phone IS NOT NULL AND _phone <> _i.invitee_phone THEN
    RAISE EXCEPTION 'invite is locked to a different phone';
  END IF;
  IF EXISTS (SELECT 1 FROM public.referral_relationships WHERE invitee_user_id = _uid) THEN
    RAISE EXCEPTION 'user already used an invite';
  END IF;

  UPDATE public.invites
    SET status = 'used', used_at = now(), invitee_user_id = _uid
    WHERE id = _i.id RETURNING * INTO _i;

  INSERT INTO public.referral_relationships (inviter_user_id, invitee_user_id, invite_id)
  VALUES (_i.inviter_user_id, _uid, _i.id);

  INSERT INTO public.invite_events (invite_id, event_type, actor_id)
  VALUES (_i.id, 'consumed', _uid);

  RETURN _i;
END $$;

-- Mark as claimed (signup started)
CREATE OR REPLACE FUNCTION public.claim_invite(_code text)
RETURNS public.invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _i public.invites;
BEGIN
  SELECT * INTO _i FROM public.invites WHERE upper(code) = upper(_code) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite not found'; END IF;
  IF _i.status = 'pending' THEN
    UPDATE public.invites SET status = 'claimed', claimed_at = now()
    WHERE id = _i.id RETURNING * INTO _i;
    INSERT INTO public.invite_events (invite_id, event_type, actor_id)
    VALUES (_i.id, 'claimed', auth.uid());
  END IF;
  RETURN _i;
END $$;
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO anon, authenticated;

-- Revoke (owner or admin)
CREATE OR REPLACE FUNCTION public.revoke_invite(_invite_id uuid)
RETURNS public.invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _i public.invites;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _i FROM public.invites WHERE id = _invite_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite not found'; END IF;
  IF _i.inviter_user_id <> auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _i.status = 'used' THEN RAISE EXCEPTION 'cannot revoke used invite'; END IF;
  UPDATE public.invites SET status='revoked', revoked_at=now(), revoked_by=auth.uid()
  WHERE id=_invite_id RETURNING * INTO _i;
  INSERT INTO public.invite_events (invite_id, event_type, actor_id)
  VALUES (_i.id, 'revoked', auth.uid());
  RETURN _i;
END $$;

-- Admin grant extra allowance
CREATE OR REPLACE FUNCTION public.grant_extra_invites(_user_id uuid, _extra int)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _new int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET invite_allowance = invite_allowance + _extra
  WHERE id = _user_id RETURNING invite_allowance INTO _new;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, notes)
  VALUES (auth.uid(), 'invites.grant_extra', 'user', _user_id, _extra::text);
  RETURN _new;
END $$;
