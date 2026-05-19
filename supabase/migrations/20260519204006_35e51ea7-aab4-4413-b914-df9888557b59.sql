
CREATE TABLE public.seller_identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  stripe_verification_session_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'requires_input',
  document_type TEXT,
  last_error TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, environment)
);

ALTER TABLE public.seller_identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own identity verification"
  ON public.seller_identity_verifications
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users insert own identity verification"
  ON public.seller_identity_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_seller_identity_verifications_updated
  BEFORE UPDATE ON public.seller_identity_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_seller_identity_verifications_user
  ON public.seller_identity_verifications (user_id, environment);
