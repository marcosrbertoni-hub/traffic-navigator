create or replace function public.schedule_due_campaigns()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare c record; requested integer; created integer:=0;
begin
  for c in
    select ca.* from public.campaigns ca
    where ca.status='active'
      and not exists (
        select 1 from public.jobs j
        where j.campaign_id=ca.id and j.status in ('queued','running')
      )
  loop
    requested:=greatest(coalesce((c.volume->>'daily_limit')::integer,1),1);
    insert into public.credit_balances(user_id,balance) values(c.user_id,0) on conflict(user_id) do nothing;
    update public.credit_balances set balance=balance-requested,updated_at=now()
    where user_id=c.user_id and balance>=requested;
    if found then
      insert into public.credit_transactions(user_id,type,amount,campaign_id,description)
      values(c.user_id,'consumption',-requested,c.id,'Consumo diário da campanha');
      update public.campaigns set consumed_sessions=consumed_sessions+requested,last_run_at=now() where id=c.id;
      insert into public.jobs(campaign_id,status,scheduled_at,payload)
      values(c.id,'queued',now(),jsonb_build_object('requested_sessions',requested,'source','scheduler'));
      created:=created+1;
    else
      update public.campaigns set status='error' where id=c.id;
    end if;
  end loop;
  return created;
end;
$$;

revoke all on function public.schedule_due_campaigns() from public,anon,authenticated;
grant execute on function public.schedule_due_campaigns() to service_role;
