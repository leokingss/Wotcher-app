
-- 1. Add 'moderator' to app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Helper: is admin or moderator
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','moderator')
  );
$$;

-- 3. Extend reports table with queue fields
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS resolution_notes text;

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('open','investigating','resolved','dismissed','escalated'));
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_severity_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_severity_check
  CHECK (severity IN ('low','normal','high','critical'));

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

-- Allow staff to read and update reports
DROP POLICY IF EXISTS "staff read all reports" ON public.reports;
CREATE POLICY "staff read all reports" ON public.reports FOR SELECT
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff update reports" ON public.reports;
CREATE POLICY "staff update reports" ON public.reports FOR UPDATE
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 4. Audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  before_state jsonb,
  after_state jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.admin_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.admin_audit_log(target_type, target_id, created_at DESC);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read audit log" ON public.admin_audit_log FOR SELECT
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert audit log" ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = actor_id);

-- 5. Seller warnings
CREATE TABLE IF NOT EXISTS public.seller_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  issued_by uuid NOT NULL,
  reason text NOT NULL,
  details text,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_warnings_user ON public.seller_warnings(user_id, created_at DESC);
ALTER TABLE public.seller_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage warnings" ON public.seller_warnings FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "users read own warnings" ON public.seller_warnings FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Account flags
CREATE TABLE IF NOT EXISTS public.account_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flag text NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  cleared_at timestamptz,
  cleared_by uuid
);
ALTER TABLE public.account_flags DROP CONSTRAINT IF EXISTS account_flags_flag_check;
ALTER TABLE public.account_flags ADD CONSTRAINT account_flags_flag_check
  CHECK (flag IN ('high_risk','duplicate_account','fraud_watch','manual_review','banned'));
CREATE INDEX IF NOT EXISTS idx_account_flags_user_active
  ON public.account_flags(user_id) WHERE cleared_at IS NULL;
ALTER TABLE public.account_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage flags" ON public.account_flags FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 7. Seller trust scores (cache)
CREATE TABLE IF NOT EXISTS public.seller_trust_scores (
  user_id uuid PRIMARY KEY,
  trust_score int NOT NULL DEFAULT 50,
  risk_level text NOT NULL DEFAULT 'medium',
  verified_badge boolean NOT NULL DEFAULT false,
  successful_sales int NOT NULL DEFAULT 0,
  total_sales int NOT NULL DEFAULT 0,
  refund_count int NOT NULL DEFAULT 0,
  dispute_count int NOT NULL DEFAULT 0,
  delivered_count int NOT NULL DEFAULT 0,
  account_age_days int NOT NULL DEFAULT 0,
  identity_verified boolean NOT NULL DEFAULT false,
  computed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_trust_scores DROP CONSTRAINT IF EXISTS seller_trust_risk_check;
ALTER TABLE public.seller_trust_scores ADD CONSTRAINT seller_trust_risk_check
  CHECK (risk_level IN ('low','medium','high','critical'));
ALTER TABLE public.seller_trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trust scores readable" ON public.seller_trust_scores FOR SELECT USING (true);
CREATE POLICY "staff write trust scores" ON public.seller_trust_scores FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 8. Extend payout_settings for new-seller policy
ALTER TABLE public.payout_settings
  ADD COLUMN IF NOT EXISTS new_seller_hold_days int NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS new_seller_threshold int NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS high_risk_hold_days int NOT NULL DEFAULT 21;

-- 9. Recompute a seller trust score
CREATE OR REPLACE FUNCTION public.recompute_trust_score(_user_id uuid)
RETURNS public.seller_trust_scores
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _row public.seller_trust_scores;
  _total int := 0;
  _delivered int := 0;
  _refunds int := 0;
  _disputes int := 0;
  _ok int := 0;
  _age int := 0;
  _ident boolean := false;
  _flag_high boolean := false;
  _score int := 50;
  _risk text := 'medium';
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE delivered_at IS NOT NULL),
         COUNT(*) FILTER (WHERE refunded_at IS NOT NULL),
         COUNT(*) FILTER (WHERE disputed_at IS NOT NULL),
         COUNT(*) FILTER (WHERE status IN ('delivered') AND refunded_at IS NULL AND disputed_at IS NULL)
  INTO _total, _delivered, _refunds, _disputes, _ok
  FROM public.marketplace_orders WHERE seller_id = _user_id;

  SELECT GREATEST(0, EXTRACT(DAY FROM (now() - created_at))::int)
  INTO _age FROM public.profiles WHERE id = _user_id;

  SELECT EXISTS (
    SELECT 1 FROM public.seller_identity_verifications
    WHERE user_id = _user_id AND status = 'verified'
  ) INTO _ident;

  SELECT EXISTS (
    SELECT 1 FROM public.account_flags
    WHERE user_id = _user_id AND cleared_at IS NULL
      AND flag IN ('high_risk','fraud_watch','banned')
  ) INTO _flag_high;

  -- Score: start 50, +successful sales, -disputes/refunds, +age, +verified
  _score := 50
    + LEAST(30, _ok * 2)
    + LEAST(10, _age / 30)
    + (CASE WHEN _ident THEN 10 ELSE -10 END)
    - LEAST(40, _disputes * 10)
    - LEAST(20, _refunds * 4);
  IF _flag_high THEN _score := _score - 30; END IF;
  _score := GREATEST(0, LEAST(100, _score));

  _risk := CASE
    WHEN _flag_high OR _score < 30 THEN 'critical'
    WHEN _score < 50 THEN 'high'
    WHEN _score < 75 THEN 'medium'
    ELSE 'low'
  END;

  INSERT INTO public.seller_trust_scores
    (user_id, trust_score, risk_level, verified_badge, successful_sales, total_sales,
     refund_count, dispute_count, delivered_count, account_age_days, identity_verified, computed_at)
  VALUES
    (_user_id, _score, _risk, (_ident AND _ok >= 5 AND _disputes = 0), _ok, _total,
     _refunds, _disputes, _delivered, _age, _ident, now())
  ON CONFLICT (user_id) DO UPDATE SET
    trust_score = EXCLUDED.trust_score,
    risk_level = EXCLUDED.risk_level,
    verified_badge = EXCLUDED.verified_badge,
    successful_sales = EXCLUDED.successful_sales,
    total_sales = EXCLUDED.total_sales,
    refund_count = EXCLUDED.refund_count,
    dispute_count = EXCLUDED.dispute_count,
    delivered_count = EXCLUDED.delivered_count,
    account_age_days = EXCLUDED.account_age_days,
    identity_verified = EXCLUDED.identity_verified,
    computed_at = now()
  RETURNING * INTO _row;
  RETURN _row;
END $$;

-- 10. Update mark_order_delivered to use longer holds for new/high-risk sellers
CREATE OR REPLACE FUNCTION public.mark_order_delivered(_order_id uuid)
RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _row public.marketplace_orders;
  _s public.payout_settings;
  _ok int := 0;
  _is_high boolean := false;
  _hold int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _s FROM public.payout_settings WHERE id = 1;

  UPDATE public.marketplace_orders
  SET status = 'delivered', delivered_at = now(), updated_at = now()
  WHERE id = _order_id AND buyer_id = auth.uid() AND status = 'shipped'
  RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found or not in shipped state'; END IF;

  SELECT COUNT(*) INTO _ok FROM public.marketplace_orders
    WHERE seller_id = _row.seller_id AND status = 'delivered' AND refunded_at IS NULL;
  SELECT EXISTS (
    SELECT 1 FROM public.account_flags
    WHERE user_id = _row.seller_id AND cleared_at IS NULL
      AND flag IN ('high_risk','fraud_watch')
  ) INTO _is_high;

  _hold := COALESCE(_s.hold_days, 7);
  IF _ok <= COALESCE(_s.new_seller_threshold, 5) THEN
    _hold := GREATEST(_hold, COALESCE(_s.new_seller_hold_days, 14));
  END IF;
  IF _is_high THEN
    _hold := GREATEST(_hold, COALESCE(_s.high_risk_hold_days, 21));
  END IF;

  UPDATE public.marketplace_orders
  SET release_after = COALESCE(release_after, now() + make_interval(days => _hold))
  WHERE id = _order_id
  RETURNING * INTO _row;
  RETURN _row;
END $$;

-- 11. Staff RPCs for the report queue
CREATE OR REPLACE FUNCTION public.resolve_report(
  _report_id uuid, _status text, _resolution text, _notes text
) RETURNS public.reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.reports;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('investigating','resolved','dismissed','escalated','open') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.reports SET
    status = _status,
    resolution = _resolution,
    resolution_notes = _notes,
    resolved_by = CASE WHEN _status IN ('resolved','dismissed') THEN auth.uid() ELSE resolved_by END,
    resolved_at = CASE WHEN _status IN ('resolved','dismissed') THEN now() ELSE resolved_at END
  WHERE id = _report_id RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'report not found'; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after_state, notes)
  VALUES (auth.uid(), 'report.' || _status, 'report', _report_id, to_jsonb(_row), _notes);
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.warn_seller(_user_id uuid, _reason text, _details text)
RETURNS public.seller_warnings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.seller_warnings;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.seller_warnings (user_id, issued_by, reason, details)
  VALUES (_user_id, auth.uid(), _reason, _details) RETURNING * INTO _row;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after_state, notes)
  VALUES (auth.uid(), 'seller.warn', 'user', _user_id, to_jsonb(_row), _details);
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.flag_account(_user_id uuid, _flag text, _reason text)
RETURNS public.account_flags
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.account_flags;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.account_flags (user_id, flag, reason, created_by)
  VALUES (_user_id, _flag, _reason, auth.uid()) RETURNING * INTO _row;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after_state, notes)
  VALUES (auth.uid(), 'account.flag.' || _flag, 'user', _user_id, to_jsonb(_row), _reason);
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.clear_account_flag(_flag_id uuid, _notes text)
RETURNS public.account_flags
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.account_flags;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.account_flags SET cleared_at = now(), cleared_by = auth.uid()
  WHERE id = _flag_id AND cleared_at IS NULL RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'flag not found or already cleared'; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after_state, notes)
  VALUES (auth.uid(), 'account.flag.clear', 'user', _row.user_id, to_jsonb(_row), _notes);
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.suspend_seller(_user_id uuid, _reason text, _notes text)
RETURNS public.seller_suspensions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.seller_suspensions;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.seller_suspensions (user_id, reason, notes, suspended_by)
  VALUES (_user_id, _reason, _notes, auth.uid()) RETURNING * INTO _row;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after_state, notes)
  VALUES (auth.uid(), 'seller.suspend', 'user', _user_id, to_jsonb(_row), _notes);
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.lift_seller_suspension(_suspension_id uuid, _notes text)
RETURNS public.seller_suspensions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.seller_suspensions;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.seller_suspensions SET lifted_at = now(), lifted_by = auth.uid()
  WHERE id = _suspension_id AND lifted_at IS NULL RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'suspension not found or already lifted'; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after_state, notes)
  VALUES (auth.uid(), 'seller.lift', 'user', _row.user_id, to_jsonb(_row), _notes);
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.remove_listing(_listing_id uuid, _reason text)
RETURNS public.listings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.listings;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.listings SET status = 'canceled', updated_at = now()
  WHERE id = _listing_id RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'listing not found'; END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after_state, notes)
  VALUES (auth.uid(), 'listing.remove', 'listing', _listing_id, to_jsonb(_row), _reason);
  RETURN _row;
END $$;

-- 12. Allow staff to read marketplace_orders + disputes (admin already has it; moderator needs it)
DROP POLICY IF EXISTS "staff read all orders" ON public.marketplace_orders;
CREATE POLICY "staff read all orders" ON public.marketplace_orders FOR SELECT
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff read all disputes" ON public.disputes;
CREATE POLICY "staff read all disputes" ON public.disputes FOR SELECT
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "staff update disputes" ON public.disputes;
CREATE POLICY "staff update disputes" ON public.disputes FOR UPDATE
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
