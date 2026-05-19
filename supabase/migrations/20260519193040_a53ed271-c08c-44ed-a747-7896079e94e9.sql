create table public.seller_stripe_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  environment text not null default 'sandbox',
  stripe_account_id text not null,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  requirements_due jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, environment),
  unique (stripe_account_id)
);

alter table public.seller_stripe_accounts enable row level security;

create policy "users read own connect account"
on public.seller_stripe_accounts for select
using (auth.uid() = user_id or has_role(auth.uid(), 'admin'::app_role));

create policy "users insert own connect account"
on public.seller_stripe_accounts for insert
with check (auth.uid() = user_id);

create trigger seller_stripe_accounts_updated_at
before update on public.seller_stripe_accounts
for each row execute function public.set_updated_at();