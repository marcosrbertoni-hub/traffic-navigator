-- Execution worker hardening.
create or replace function public.claim_next_job(p_worker_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare claimed public.jobs;
begin
  update public.jobs j
  set status='running', started_at=now(), attempts=attempts+1
  where j.id = (
    select id from public.jobs
    where status='queued'
      and (scheduled_at is null or scheduled_at <= now())
    order by scheduled_at nulls first, created_at
    for update skip locked
    limit 1
  )
  returning * into claimed;

  if claimed.id is not null then
    insert into public.job_runs(job_id,worker_id,started_at)
    values(claimed.id,p_worker_id::text,now());
  end if;
  return claimed;
end;
$$;

revoke all on function public.claim_next_job(uuid) from public, anon, authenticated;
grant execute on function public.claim_next_job(uuid) to service_role;

drop view if exists public.campaign_execution_summary;
create view public.campaign_execution_summary with (security_invoker=true) as
select c.id as campaign_id,c.user_id,c.name,
count(es.id)::integer as sessions_total,
count(es.id) filter (where es.status='queued')::integer as sessions_queued,
count(es.id) filter (where es.status='running')::integer as sessions_running,
count(es.id) filter (where es.status='succeeded')::integer as sessions_succeeded,
count(es.id) filter (where es.status='failed')::integer as sessions_failed,
coalesce(sum(es.pages_visited),0)::integer as pages_visited,
coalesce(round(avg(es.actual_duration_sec))::integer,0) as avg_duration_sec
from public.campaigns c
left join public.execution_sessions es on es.campaign_id=c.id
group by c.id,c.user_id,c.name;
