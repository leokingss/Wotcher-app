
-- Notification triggers
create or replace function public.notify_post_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare _owner uuid;
begin
  select user_id into _owner from public.posts where id = new.post_id;
  if _owner is not null and _owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (_owner, new.user_id, new.reaction::text::public.notification_type, new.post_id);
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_post_reaction() from public, anon, authenticated;
create trigger trg_notify_post_reaction after insert on public.post_reactions
  for each row execute function public.notify_post_reaction();

create or replace function public.notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare _owner uuid;
begin
  select user_id into _owner from public.posts where id = new.post_id;
  if _owner is not null and _owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (_owner, new.user_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_comment() from public, anon, authenticated;
create trigger trg_notify_comment after insert on public.comments
  for each row execute function public.notify_comment();

create or replace function public.notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$;
revoke execute on function public.notify_follow() from public, anon, authenticated;
create trigger trg_notify_follow after insert on public.follows
  for each row execute function public.notify_follow();
