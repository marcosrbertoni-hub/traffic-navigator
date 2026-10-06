-- Traffic Navigator
-- PostgreSQL schema for the production backend.
-- Authentication is provided by Supabase Auth; auth.users.id is the application user id.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  company text,
  created_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  domain text not null,
  status text not null default 'pending' check (status in ('pending','verified','failed')),
  verification_token text not null unique,
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  analysis jsonb
);

create index if not exists sites_user_id_idx on public.sites(user_id);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  start_url text not null,
  description text not null default '',
  sitemap_url text not null default '',
  status text not null default 'draft' check (status in ('draft','active','paused','completed','error')),
  settings jsonb not null default '{}'::jsonb,
  pages jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  location jsonb not null default '{}'::jsonb,
  volume jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '{}'::jsonb,
  consumed_sessions integer not null default 0 check (consumed_sessions >= 0),
  created_at timestamptz not null default now(),
  last_run_at timestamptz
);

create index if not exists campaigns_user_id_idx on public.campaigns(user_id);
create index if not exists campaigns_site_id_idx on public.campaigns(site_id);
create index if not exists campaigns_status_idx on public.campaigns(status);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null default '',
  price_monthly numeric(12,2),
  credits_monthly integer not null default 0,
  max_sites integer,
  max_campaigns integer,
  features jsonb not null default '[]'::jsonb,
  highlighted boolean not null default false,
  is_trial boolean not null default false
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null check (status in ('trialing','active','past_due','canceled')),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('purchase','grant','consumption','expiration','refund')),
  amount integer not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_id_idx on public.credit_transactions(user_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  currency text not null default 'BRL',
  status text not null check (status in ('paid','pending','failed','refunded')),
  description text not null default '',
  invoice_url text,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments(user_id);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','canceled')),
  scheduled_for timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

create index if not exists jobs_status_schedule_idx on public.jobs(status, scheduled_for);
create index if not exists jobs_campaign_id_idx on public.jobs(campaign_id);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  pages_visited integer not null default 0,
  error text
);

create index if not exists job_runs_job_id_idx on public.job_runs(job_id);

create table if not exists public.workers (
  id text primary key,
  region text not null,
  status text not null default 'offline' check (status in ('online','idle','offline')),
  last_heartbeat timestamptz,
  jobs_in_progress integer not null default 0 check (jobs_in_progress >= 0)
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info','warn','error')),
  source text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: users can only access their own application data.
alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.campaigns enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.payments enable row level security;

create policy profiles_self_select on public.profiles for select using (id = auth.uid());
create policy profiles_self_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy sites_owner_all on public.sites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy campaigns_owner_all on public.campaigns for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy subscriptions_owner_select on public.subscriptions for select using (user_id = auth.uid());
create policy credit_transactions_owner_select on public.credit_transactions for select using (user_id = auth.uid());
create policy payments_owner_select on public.payments for select using (user_id = auth.uid());

-- Public catalog of plans; mutations should be restricted to server/admin tooling.
alter table public.plans enable row level security;
create policy plans_public_select on public.plans for select using (true);

-- Queue/worker tables are intentionally not exposed to end users.
alter table public.jobs enable row level security;
alter table public.job_runs enable row level security;
alter table public.workers enable row level security;
alter table public.logs enable row level security;

-- No end-user policies are created for jobs/job_runs/workers/logs.
-- Scheduler/worker operations must run through trusted server-side credentials.
