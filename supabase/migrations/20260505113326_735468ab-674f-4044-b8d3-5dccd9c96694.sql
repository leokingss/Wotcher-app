
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles readable by all" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text,1,4)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  location text,
  image_url text not null,
  media_type text not null default 'image',
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "posts readable by all" on public.posts for select using (true);
create policy "users insert own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "users update own posts" on public.posts for update using (auth.uid() = user_id);
create policy "users delete own posts" on public.posts for delete using (auth.uid() = user_id);
create index posts_user_id_idx on public.posts(user_id);
create index posts_created_at_idx on public.posts(created_at desc);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.comments enable row level security;
create policy "comments readable by all" on public.comments for select using (true);
create policy "users insert own comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "users update own comments" on public.comments for update using (auth.uid() = user_id);
create policy "users delete own comments" on public.comments for delete using (auth.uid() = user_id);
create index comments_post_id_idx on public.comments(post_id);

-- Reactions (like/dislike) - mutually exclusive per user/post
create type public.reaction_type as enum ('like','dislike');
create table public.post_reactions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  reaction public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.post_reactions enable row level security;
create policy "reactions readable by all" on public.post_reactions for select using (true);
create policy "users insert own reactions" on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "users update own reactions" on public.post_reactions for update using (auth.uid() = user_id);
create policy "users delete own reactions" on public.post_reactions for delete using (auth.uid() = user_id);
create index post_reactions_post_idx on public.post_reactions(post_id);

create table public.comment_reactions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_id uuid not null references public.comments(id) on delete cascade,
  reaction public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);
alter table public.comment_reactions enable row level security;
create policy "comment reactions readable by all" on public.comment_reactions for select using (true);
create policy "users insert own comment reactions" on public.comment_reactions for insert with check (auth.uid() = user_id);
create policy "users update own comment reactions" on public.comment_reactions for update using (auth.uid() = user_id);
create policy "users delete own comment reactions" on public.comment_reactions for delete using (auth.uid() = user_id);

-- Follows
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.follows enable row level security;
create policy "follows readable by all" on public.follows for select using (true);
create policy "users insert own follows" on public.follows for insert with check (auth.uid() = follower_id);
create policy "users delete own follows" on public.follows for delete using (auth.uid() = follower_id);

-- Notifications
create type public.notification_type as enum ('like','dislike','comment','follow');
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  post_id uuid references public.posts(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "users update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "system insert notifications" on public.notifications for insert with check (true);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- Storage bucket for post media + avatars
insert into storage.buckets (id, name, public) values ('media','media',true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars','avatars',true) on conflict do nothing;

create policy "public read media" on storage.objects for select using (bucket_id in ('media','avatars'));
create policy "auth upload media" on storage.objects for insert
  with check (bucket_id in ('media','avatars') and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own media" on storage.objects for update
  using (bucket_id in ('media','avatars') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own media" on storage.objects for delete
  using (bucket_id in ('media','avatars') and (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.post_reactions;
alter publication supabase_realtime add table public.notifications;
