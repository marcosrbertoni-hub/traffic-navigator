create table if not exists public.credit_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.credit_balances enable row level security;

create policy credit_balances_owner_select on public.credit_balances
  for select to authenticated
  using (user_id = (select auth.uid()));

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
  select user_id into uid from public.campaigns where id = p_campaign_id;
  if uid is null or uid <> auth.uid() then raise exception 'campaign not found'; end if;

  insert into public.credit_balances(user_id, balance)
  values(uid, 0)
  on conflict(user_id) do nothing;

  update public.credit_balances
  set balance = balance - p_amount, updated_at = now()
  where user_id = uid and balance >= p_amount
  returning balance into remaining;

  if remaining is null then raise exception 'insufficient credits'; end if;

  insert into public.credit_transactions(user_id, type, amount, campaign_id, description)
  values(uid, 'consumption', -p_amount, p_campaign_id, 'Consumo da campanha');

  update public.campaigns
  set consumed_sessions = consumed_sessions + p_amount
  where id = p_campaign_id;

  return remaining;
end;
$$;

revoke all on function public.consume_campaign_credits(uuid, integer) from public, anon;
grant execute on function public.consume_campaign_credits(uuid, integer) to authenticated;
