-- Admin controls and safe server-side credit grants.
alter table public.profiles add column if not exists role text not null default 'user' check (role in ('user','admin'));
create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select on public.profiles for select to authenticated
  using ((id = (select auth.uid())) or public.is_admin());

drop policy if exists sites_admin_all on public.sites;
create policy sites_admin_all on public.sites for all to authenticated
  using ((user_id = (select auth.uid())) or public.is_admin())
  with check ((user_id = (select auth.uid())) or public.is_admin());

drop policy if exists campaigns_admin_all on public.campaigns;
create policy campaigns_admin_all on public.campaigns for all to authenticated
  using ((user_id = (select auth.uid())) or public.is_admin())
  with check ((user_id = (select auth.uid())) or public.is_admin());

drop policy if exists credit_transactions_admin_select on public.credit_transactions;
create policy credit_transactions_admin_select on public.credit_transactions for select to authenticated
  using ((user_id = (select auth.uid())) or public.is_admin());

drop policy if exists payments_admin_select on public.payments;
create policy payments_admin_select on public.payments for select to authenticated
  using ((user_id = (select auth.uid())) or public.is_admin());

drop policy if exists subscriptions_admin_select on public.subscriptions;
create policy subscriptions_admin_select on public.subscriptions for select to authenticated
  using ((user_id = (select auth.uid())) or public.is_admin());

drop policy if exists plans_admin_insert on public.plans;
create policy plans_admin_insert on public.plans for insert to authenticated with check (public.is_admin());
drop policy if exists plans_admin_update on public.plans;
create policy plans_admin_update on public.plans for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists plans_admin_delete on public.plans;
create policy plans_admin_delete on public.plans for delete to authenticated using (public.is_admin());

create or replace function public.admin_grant_credits(p_user_id uuid, p_amount integer, p_description text)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if p_description is null or length(trim(p_description)) = 0 then raise exception 'description required'; end if;
  insert into public.credit_balances(user_id, balance) values(p_user_id, 0) on conflict(user_id) do nothing;
  update public.credit_balances set balance = balance + p_amount, updated_at = now()
    where user_id = p_user_id returning balance into new_balance;
  if new_balance is null then raise exception 'user not found'; end if;
  insert into public.credit_transactions(user_id, type, amount, description)
    values(p_user_id, 'grant', p_amount, p_description);
  return new_balance;
end;
$$;
revoke all on function public.admin_grant_credits(uuid, integer, text) from public, anon;
grant execute on function public.admin_grant_credits(uuid, integer, text) to authenticated;
