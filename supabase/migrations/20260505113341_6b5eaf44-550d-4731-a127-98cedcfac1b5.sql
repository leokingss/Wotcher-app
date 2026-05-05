
-- Fix function search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Lock down notifications insert: only authenticated users, only as themselves (actor)
drop policy if exists "system insert notifications" on public.notifications;
create policy "actors insert notifications" on public.notifications for insert
  to authenticated with check (auth.uid() = actor_id);

-- Revoke public execute on security definer functions
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
