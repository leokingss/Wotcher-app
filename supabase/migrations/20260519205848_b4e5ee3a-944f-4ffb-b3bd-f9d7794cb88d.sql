
CREATE TABLE public.seller_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  notes text,
  suspended_by uuid NOT NULL,
  suspended_at timestamptz NOT NULL DEFAULT now(),
  lifted_at timestamptz,
  lifted_by uuid
);

CREATE UNIQUE INDEX seller_suspensions_active_idx
  ON public.seller_suspensions(user_id) WHERE lifted_at IS NULL;

ALTER TABLE public.seller_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage suspensions"
  ON public.seller_suspensions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users read own suspension"
  ON public.seller_suspensions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_seller_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.seller_suspensions
    WHERE user_id = _user_id AND lifted_at IS NULL
  );
$$;
