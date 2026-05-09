-- Add message to notification enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'message';

-- Conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON public.conversation_participants(user_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  media_url text,
  media_type text NOT NULL DEFAULT 'text' CHECK (media_type IN ('text','voice','image','video')),
  duration_seconds int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conv_time ON public.messages(conversation_id, created_at DESC);

-- Security-definer helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_cid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _cid AND user_id = _uid
  )
$$;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- conversations
CREATE POLICY "participants read conversations" ON public.conversations
  FOR SELECT USING (public.is_conversation_participant(id, auth.uid()));
CREATE POLICY "authenticated insert conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "participants update conversation" ON public.conversations
  FOR UPDATE USING (public.is_conversation_participant(id, auth.uid()));

-- conversation_participants
CREATE POLICY "users read own participation" ON public.conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_conversation_participant(conversation_id, auth.uid())
  );
CREATE POLICY "users insert own participation" ON public.conversation_participants
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "users update own participation" ON public.conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- messages
CREATE POLICY "participants read messages" ON public.messages
  FOR SELECT USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "participants insert messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "senders update own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());
CREATE POLICY "senders delete own messages" ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- get or create 1:1 DM
CREATE OR REPLACE FUNCTION public.get_or_create_dm(_other uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me uuid := auth.uid();
  _cid uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _other = _me THEN RAISE EXCEPTION 'cannot DM yourself'; END IF;

  SELECT cp1.conversation_id INTO _cid
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
   AND cp2.user_id = _other
  WHERE cp1.user_id = _me
  GROUP BY cp1.conversation_id
  HAVING COUNT(*) = 1
  LIMIT 1;

  IF _cid IS NOT NULL THEN
    -- ensure exactly 2 participants
    IF (SELECT COUNT(*) FROM public.conversation_participants WHERE conversation_id = _cid) = 2 THEN
      RETURN _cid;
    END IF;
  END IF;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO _cid;
  INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (_cid, _me), (_cid, _other);
  RETURN _cid;
END $$;

-- Bump last_message_at + notify recipient on new message
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  INSERT INTO public.notifications (user_id, actor_id, type, metadata)
  SELECT cp.user_id, NEW.sender_id, 'message',
         jsonb_build_object('conversation_id', NEW.conversation_id, 'preview', LEFT(COALESCE(NEW.body, NEW.media_type), 80))
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id AND cp.user_id <> NEW.sender_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_new_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Storage bucket for DM media (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('dm-media', 'dm-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "dm participants read media" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'dm-media'
  AND public.is_conversation_participant((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "dm participants upload media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dm-media'
  AND public.is_conversation_participant((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "dm uploaders delete own media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dm-media' AND owner = auth.uid());