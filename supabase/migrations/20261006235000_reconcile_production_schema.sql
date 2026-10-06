-- Reconcile the live Supabase schema with the application execution, credits and admin flows.
-- Idempotent so it can safely be applied when the remote migration history is synchronized.

begin;

alter table public.campaigns
  add column if not exists consumed_sessions integer not null default 0,
  add column if not exists last_run_at timestamptz;

alter table public.plans
  add column if not exists tagline text not null default '',
  add column if not exists price_monthly numeric(12,2),
  add column if not exists credits_monthly integer not null default 0,
  add column if not exists max_sites integer,
  add column if not exists max_campaigns integer,
  add column if not exists highlighted boolean not null default false,
  add column if not exists is_trial boolean not null default false;

alter table public.plans
  alter column slug set default md5(gen_random_uuid()::text);

update public.plans
set
  price_monthly = coalesce(price_monthly, round(price_cents::numeric / 100, 2)),
  credits_monthly = case when credits_monthly = 0 then credits else credits_monthly end
where price_monthly is null or credits_monthly = 0;

alter table public.job_runs
  add column if not exists worker_id text;

create index if not exists execution_sessions_campaign_id_idx
  on public.execution_sessions(campaign_id);
create index if not exists jobs_campaign_status_idx
  on public.jobs(campaign_id, status);

create or replace function public.claim_next_job(p_worker_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.jobs;
begin
  update public.jobs j
  set status='running', started_at=now(), attempts=attempts+1
  where j.id = (
    select id
    from public.jobs
    where status='queued'
      and (scheduled_at is null or scheduled_at <= now())
    order by scheduled_at nulls first, created_at
    for update skip locked
    limit 1
  )
  returning * into claimed;

  if claimed.id is not null then
    insert into public.job_runs(job_id, worker_id, status, started_at, metrics)
    values(claimed.id, p_worker_id::text, 'running', now(), jsonb_build_object('attempt', claimed.attempts));
  end if;

  return claimed;
end;
$$;

revoke all on function public.claim_next_job(uuid) from public, anon, authenticated;
grant execute on function public.claim_next_job(uuid) to service_role;

create or replace function public.schedule_due_campaigns()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  requested integer;
  created integer := 0;
begin
  for c in
    select ca.*
    from public.campaigns ca
    where ca.status='active'
      and not exists (
        select 1
        from public.jobs j
        where j.campaign_id=ca.id
          and j.status in ('queued','running')
      )
  loop
    requested := greatest(coalesce((c.volume->>'daily_limit')::integer, 1), 1);

    insert into public.credit_balances(user_id,balance)
    values(c.user_id,0)
    on conflict(user_id) do nothing;

    update public.credit_balances
    set balance=balance-requested, updated_at=now()
    where user_id=c.user_id and balance>=requested;

    if found then
      insert into public.credit_transactions(user_id,type,amount,campaign_id,description)
      values(c.user_id,'consumption',-requested,c.id,'Consumo diário da campanha');

      update public.campaigns
      set consumed_sessions=consumed_sessions+requested,last_run_at=now()
      where id=c.id;

      insert into public.jobs(campaign_id,status,scheduled_at,payload)
      values(c.id,'queued',now(),jsonb_build_object('requested_sessions',requested,'source','scheduler'));

      created := created + 1;
    else
      update public.campaigns
      set status='paused'
      where id=c.id;
    end if;
  end loop;

  return created;
end;
$$;

revoke all on function public.schedule_due_campaigns() from public, anon, authenticated;
grant execute on function public.schedule_due_campaigns() to service_role;

create or replace function public.consume_campaign_credits(p_campaign_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  remaining integer;
begin
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;

  select user_id into uid
  from public.campaigns
  where id=p_campaign_id;

  if uid is null or uid <> auth.uid() then
    raise exception 'campaign not found';
  end if;

  insert into public.credit_balances(user_id,balance)
  values(uid,0)
  on conflict(user_id) do nothing;

  update public.credit_balances
  set balance=balance-p_amount,updated_at=now()
  where user_id=uid and balance>=p_amount
  returning balance into remaining;

  if remaining is null then
    raise exception 'insufficient credits';
  end if;

  insert into public.credit_transactions(user_id,type,amount,campaign_id,description)
  values(uid,'consumption',-p_amount,p_campaign_id,'Consumo da campanha');

  update public.campaigns
  set consumed_sessions=consumed_sessions+p_amount
  where id=p_campaign_id;

  return remaining;
end;
$$;

revoke all on function public.consume_campaign_credits(uuid, integer) from public, anon;
grant execute on function public.consume_campaign_credits(uuid, integer) to authenticated;

create or replace function public.enqueue_campaign(p_campaign_id uuid)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  c public.campaigns;
  j uuid;
  requested integer;
begin
  select * into c
  from public.campaigns
  where id=p_campaign_id and user_id=(select auth.uid())
  for update;

  if not found then raise exception 'Campaign not found'; end if;
  if c.status <> 'active' then raise exception 'Campaign must be active'; end if;

  requested:=greatest(coalesce((c.volume->>'daily_limit')::integer,1),1);

  insert into public.credit_balances(user_id,balance)
  values(c.user_id,0)
  on conflict(user_id) do nothing;

  update public.credit_balances
  set balance=balance-requested,updated_at=now()
  where user_id=c.user_id and balance>=requested;

  if not found then raise exception 'insufficient credits'; end if;

  insert into public.credit_transactions(user_id,type,amount,campaign_id,description)
  values(c.user_id,'consumption',-requested,c.id,'Consumo ao iniciar campanha');

  update public.campaigns
  set consumed_sessions=consumed_sessions+requested
  where id=c.id;

  insert into public.jobs(campaign_id,status,scheduled_at,payload)
  values(c.id,'queued',now(),jsonb_build_object('requested_sessions',requested,'source','campaign'))
  returning id into j;

  return j;
end;
$$;

revoke all on function public.enqueue_campaign(uuid) from public, anon;
grant execute on function public.enqueue_campaign(uuid) to authenticated;

commit;
