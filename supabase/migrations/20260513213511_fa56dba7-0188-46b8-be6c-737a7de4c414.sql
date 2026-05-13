-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  toast_likes boolean NOT NULL DEFAULT true,
  toast_comments boolean NOT NULL DEFAULT true,
  toast_follows boolean NOT NULL DEFAULT true,
  toast_dms boolean NOT NULL DEFAULT true,
  toast_auctions boolean NOT NULL DEFAULT true,
  toast_volume integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own notification settings"
ON public.notification_settings
FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
ON public.notification_settings
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
ON public.notification_settings
FOR UPDATE
TO public
USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();