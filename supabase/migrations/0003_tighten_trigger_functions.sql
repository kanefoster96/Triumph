-- ---------------------------------------------------------------------------
-- Two trigger functions that did not need to be on the API
--
-- Found by the database linter after 0002. Neither is meant to be called by
-- anybody — one fires when an auth user is created, the other before an
-- update — but both were reachable as RPC endpoints on the public API.
-- Calling either directly cannot achieve anything useful; an endpoint that
-- exists for no reason is simply one more thing to get wrong later.
-- ---------------------------------------------------------------------------

revoke execute on function public.handle_new_user() from anon, authenticated;

-- A trigger function with no fixed search_path resolves its names against
-- whatever the caller's search_path happens to be.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
