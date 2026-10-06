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

revoke all on function public.enqueue_campaign(uuid) from public,anon;
grant execute on function public.enqueue_campaign(uuid) to authenticated;
