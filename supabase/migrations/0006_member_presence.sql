-- Who has been in lately.
--
-- The marketing page wants to say how many members were active in the last
-- day. A stranger reading that page may not read a single profile row, so the
-- count comes back through a SECURITY DEFINER function that returns one
-- integer and nothing else — the same shape as has_community_access, and the
-- reason is the same: the page has to ask a question the policies would
-- otherwise refuse.
alter table public.profiles add column last_seen_at timestamptz;

create index profiles_last_seen_idx on public.profiles (last_seen_at desc);

comment on column public.profiles.last_seen_at is
  'Last time they opened the members'' area. Stamped at most every 15 minutes.';

/*
 * Clients only. Dean is in here every day and counting the coach as a member
 * would quietly add one to every number the site prints.
 */
create or replace function public.active_members_24h()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.profiles
  where role = 'client'
    and status in ('active', 'paused')
    and last_seen_at > now() - interval '24 hours';
$$;

grant execute on function public.active_members_24h() to anon, authenticated;
