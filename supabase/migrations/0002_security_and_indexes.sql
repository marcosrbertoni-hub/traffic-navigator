-- Harden the profile trigger: only Supabase's trusted service role may invoke it directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists sites_owner on public.sites;
create policy sites_owner on public.sites
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists campaigns_owner on public.campaigns;
create policy campaigns_owner on public.campaigns
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists subscriptions_owner on public.subscriptions;
create policy subscriptions_owner on public.subscriptions
  for select
  using (user_id = (select auth.uid()));

drop policy if exists credits_owner on public.credit_transactions;
create policy credits_owner on public.credit_transactions
  for select
  using (user_id = (select auth.uid()));

drop policy if exists payments_owner on public.payments;
create policy payments_owner on public.payments
  for select
  using (user_id = (select auth.uid()));

-- Cover foreign keys used by ownership, billing and execution queries.
create index if not exists credit_transactions_campaign_id_idx on public.credit_transactions(campaign_id);
create index if not exists credit_transactions_user_id_idx on public.credit_transactions(user_id);
create index if not exists logs_campaign_id_idx on public.logs(campaign_id);
create index if not exists logs_job_id_idx on public.logs(job_id);
create index if not exists logs_user_id_idx on public.logs(user_id);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists subscriptions_plan_id_idx on public.subscriptions(plan_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
