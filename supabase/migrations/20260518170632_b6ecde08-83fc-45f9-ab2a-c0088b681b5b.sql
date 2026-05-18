
-- ============ Bidder registrations ============
create type public.bidder_status as enum ('pending','approved','rejected','revoked');

create table public.bidder_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  status public.bidder_status not null default 'pending',
  declared_cap numeric not null check (declared_cap > 0),
  approved_cap numeric,
  -- auction-house style proof:
  legal_name text not null,
  date_of_birth date not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text,
  postal_code text not null,
  country text not null,
  phone text not null,
  id_document_path text not null,          -- gov ID front
  id_document_back_path text,              -- gov ID back (optional)
  proof_of_address_path text not null,     -- utility bill / bank statement (<3 months)
  proof_of_funds_path text not null,       -- bank statement / brokerage
  bank_reference text,                     -- optional bank/wire reference
  agreed_terms_at timestamptz not null default now(),
  reviewer_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_bidder_registrations_updated_at
before update on public.bidder_registrations
for each row execute function public.set_updated_at();

alter table public.bidder_registrations enable row level security;

create policy "users read own registration"
on public.bidder_registrations for select
using (auth.uid() = user_id or has_role(auth.uid(),'admin'));

create policy "users insert own registration"
on public.bidder_registrations for insert
with check (auth.uid() = user_id);

create policy "users update own pending registration"
on public.bidder_registrations for update
using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id and status = 'pending');

create policy "admins manage registrations"
on public.bidder_registrations for all
using (has_role(auth.uid(),'admin'))
with check (has_role(auth.uid(),'admin'));

create index idx_bidder_reg_status on public.bidder_registrations(status);

-- ============ can_bid helper ============
create or replace function public.can_bid(_user_id uuid, _amount numeric)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.bidder_registrations
    where user_id = _user_id
      and status = 'approved'
      and (expires_at is null or expires_at > now())
      and approved_cap is not null
      and _amount <= approved_cap
  );
$$;

-- Replace bids insert policy to enforce registration + cap
drop policy if exists "users insert own bids" on public.bids;

create policy "approved bidders insert bids"
on public.bids for insert
with check (
  auth.uid() = bidder_id
  and public.can_bid(auth.uid(), amount)
  and exists (
    select 1 from public.listings l
    where l.id = bids.listing_id
      and l.type = 'auction'
      and l.status = 'active'
      and l.seller_id <> auth.uid()
      and (l.ends_at is null or l.ends_at > now())
      and bids.amount > coalesce(l.current_bid, l.starting_bid, 0)
  )
);

-- ============ Marketplace orders ============
create table public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  buyer_id uuid not null,
  seller_id uuid not null,
  kind text not null check (kind in ('buy_now','auction_win')),
  amount_cents integer not null check (amount_cents > 0),
  platform_fee_cents integer not null,
  seller_net_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending','paid','failed','refunded','canceled')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  environment text not null default 'sandbox',
  shipping jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_marketplace_orders_updated_at
before update on public.marketplace_orders
for each row execute function public.set_updated_at();

alter table public.marketplace_orders enable row level security;

create policy "buyer or seller read own orders"
on public.marketplace_orders for select
using (auth.uid() = buyer_id or auth.uid() = seller_id or has_role(auth.uid(),'admin'));

-- Inserts/updates happen only via service role (edge functions / webhook)

create index idx_orders_listing on public.marketplace_orders(listing_id);
create index idx_orders_buyer on public.marketplace_orders(buyer_id);
create index idx_orders_seller on public.marketplace_orders(seller_id);

-- ============ Private storage bucket for proofs ============
insert into storage.buckets (id, name, public)
values ('bidder-proofs','bidder-proofs', false)
on conflict (id) do nothing;

create policy "owner reads own proofs"
on storage.objects for select
using (
  bucket_id = 'bidder-proofs'
  and (auth.uid()::text = (storage.foldername(name))[1] or has_role(auth.uid(),'admin'))
);

create policy "owner uploads own proofs"
on storage.objects for insert
with check (
  bucket_id = 'bidder-proofs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "owner updates own proofs"
on storage.objects for update
using (
  bucket_id = 'bidder-proofs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "owner deletes own proofs"
on storage.objects for delete
using (
  bucket_id = 'bidder-proofs'
  and auth.uid()::text = (storage.foldername(name))[1]
);
