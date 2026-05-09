ALTER TABLE public.conversation_participants
  ADD CONSTRAINT conversation_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;