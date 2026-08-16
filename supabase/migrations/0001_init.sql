-- Triumph Training — members' area schema.
--
-- Run against a fresh Supabase project (SQL editor, or `supabase db push`).
-- Everything is per-client and private between that client and Dean, enforced
-- in the database by row level security rather than only in the UI.

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('client', 'admin');
create type public.client_status as enum ('active', 'paused');

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null default '',
  email       text,
  role        public.user_role not null default 'client',
  status      public.client_status not null default 'active',
  goal        text,
  started_on  date not null default current_date,
  created_at  timestamptz not null default now()
);

-- Every new auth user gets a profile. Clients are invited by Dean from the
-- admin area; there is no public signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used by every policy below. SECURITY DEFINER so that checking "am I an
-- admin?" does not itself recurse through profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Sessions — Dean's calendar, per client
-- ---------------------------------------------------------------------------

create type public.session_status as enum ('scheduled', 'completed', 'cancelled');

create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  starts_at        timestamptz not null,
  duration_minutes int not null default 60,
  -- "Online" or a Newcastle address.
  location         text not null default 'Online',
  status           public.session_status not null default 'scheduled',
  coach_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index sessions_client_starts_idx on public.sessions (client_id, starts_at desc);

-- ---------------------------------------------------------------------------
-- Workouts — a checklist of criteria Dean sets, ticked off by the client
-- ---------------------------------------------------------------------------

create table public.workouts (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  scheduled_for date not null,
  title         text not null default 'Workout',
  coach_notes   text,
  -- The client's own note: how it felt, weights used.
  client_note   text,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (client_id, scheduled_for)
);

create index workouts_client_date_idx on public.workouts (client_id, scheduled_for desc);

create table public.workout_items (
  id         uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  position   int not null default 0,
  label      text not null,
  -- Optional target, e.g. "3 x 5 @ 80kg".
  target     text,
  done       boolean not null default false,
  done_at    timestamptz
);

create index workout_items_workout_idx on public.workout_items (workout_id, position);

-- ---------------------------------------------------------------------------
-- Food — Dean assigns meals and/or a calorie target; the client logs against it
-- ---------------------------------------------------------------------------

-- One row per date the plan applies to. A date with no row of its own falls
-- back to the most recent earlier one, so a target set once carries forward.
create table public.food_plans (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles(id) on delete cascade,
  assigned_for   date not null default current_date,
  calorie_target int,
  protein_target int,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index food_plans_client_date_idx on public.food_plans (client_id, assigned_for);

create table public.food_plan_meals (
  id           uuid primary key default gen_random_uuid(),
  food_plan_id uuid not null references public.food_plans(id) on delete cascade,
  position     int not null default 0,
  name         text not null,
  ingredients  text,
  calories     int
);

create index food_plan_meals_plan_idx on public.food_plan_meals (food_plan_id, position);

-- One row per entry, so a client can log incrementally through the day or drop
-- in a single end-of-day total. The day's running total is the sum.
create table public.food_logs (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  logged_for date not null default current_date,
  calories   int not null,
  note       text,
  created_at timestamptz not null default now()
);

create index food_logs_client_date_idx on public.food_logs (client_id, logged_for desc);

-- ---------------------------------------------------------------------------
-- Reusable plans — built once by Dean, assigned to many days
-- ---------------------------------------------------------------------------

create table public.session_plans (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  notes      text,
  created_at timestamptz not null default now()
);

create table public.session_plan_items (
  id              uuid primary key default gen_random_uuid(),
  session_plan_id uuid not null references public.session_plans(id) on delete cascade,
  position        int not null default 0,
  label           text not null,
  target          text
);

create index session_plan_items_plan_idx on public.session_plan_items (session_plan_id, position);

create table public.day_plans (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  calorie_target int,
  protein_target int,
  notes          text,
  created_at     timestamptz not null default now()
);

create table public.day_plan_meals (
  id          uuid primary key default gen_random_uuid(),
  day_plan_id uuid not null references public.day_plans(id) on delete cascade,
  position    int not null default 0,
  name        text not null,
  ingredients text,
  calories    int
);

create index day_plan_meals_plan_idx on public.day_plan_meals (day_plan_id, position);

-- Which template a given assigned day came from. Null when Dean wrote the day
-- by hand; kept nullable so editing one day never breaks the link for others.
alter table public.workouts   add column source_plan_id uuid references public.session_plans(id) on delete set null;
alter table public.food_plans add column source_plan_id uuid references public.day_plans(id)     on delete set null;

-- ---------------------------------------------------------------------------
-- Weight
-- ---------------------------------------------------------------------------

create table public.weight_entries (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  logged_for date not null default current_date,
  weight_kg  numeric(5, 2) not null,
  note       text,
  created_at timestamptz not null default now(),
  unique (client_id, logged_for)
);

create index weight_entries_client_date_idx on public.weight_entries (client_id, logged_for desc);

-- ---------------------------------------------------------------------------
-- Comments — Dean replying to any client note
-- ---------------------------------------------------------------------------

create type public.comment_target as enum ('workout', 'food_log', 'weight_entry', 'session');

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  -- Denormalised so a comment can be scoped by RLS without a join.
  client_id   uuid not null references public.profiles(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  target_type public.comment_target not null,
  target_id   uuid not null,
  body        text not null,
  -- Null until the client has seen it; drives "new activity" on the dashboard.
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index comments_client_idx on public.comments (client_id, created_at desc);
create index comments_target_idx on public.comments (target_type, target_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sessions_touch   before update on public.sessions   for each row execute function public.touch_updated_at();
create trigger workouts_touch   before update on public.workouts   for each row execute function public.touch_updated_at();
create trigger food_plans_touch before update on public.food_plans for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
--
-- The rule for every table: a client reaches only their own rows; Dean (admin)
-- reaches everything. Clients may write their own logs, ticks and notes but
-- never the coaching content Dean sets.
-- ---------------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.sessions        enable row level security;
alter table public.workouts        enable row level security;
alter table public.workout_items   enable row level security;
alter table public.food_plans      enable row level security;
alter table public.food_plan_meals enable row level security;
alter table public.food_logs       enable row level security;
alter table public.weight_entries  enable row level security;
alter table public.comments        enable row level security;
alter table public.session_plans      enable row level security;
alter table public.session_plan_items enable row level security;
alter table public.day_plans          enable row level security;
alter table public.day_plan_meals     enable row level security;

-- Profiles
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy "admin manages profiles" on public.profiles
  for insert with check (public.is_admin());
create policy "admin deletes profiles" on public.profiles
  for delete using (public.is_admin());

-- Sessions: read-only for the client, fully editable by Dean.
create policy "read own sessions" on public.sessions
  for select using (client_id = auth.uid() or public.is_admin());
create policy "admin writes sessions" on public.sessions
  for all using (public.is_admin()) with check (public.is_admin());

-- Workouts: the client may update their own row (tick-off state lives on items,
-- the note and completion live here); only Dean creates or deletes them.
create policy "read own workouts" on public.workouts
  for select using (client_id = auth.uid() or public.is_admin());
create policy "client updates own workout" on public.workouts
  for update using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());
create policy "admin creates workouts" on public.workouts
  for insert with check (public.is_admin());
create policy "admin deletes workouts" on public.workouts
  for delete using (public.is_admin());

-- Workout items: client ticks them, Dean writes them.
create policy "read own workout items" on public.workout_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.workouts w where w.id = workout_id and w.client_id = auth.uid())
  );
create policy "client ticks own workout items" on public.workout_items
  for update using (
    public.is_admin()
    or exists (select 1 from public.workouts w where w.id = workout_id and w.client_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.workouts w where w.id = workout_id and w.client_id = auth.uid())
  );
create policy "admin writes workout items" on public.workout_items
  for insert with check (public.is_admin());
create policy "admin deletes workout items" on public.workout_items
  for delete using (public.is_admin());

-- Food plans and meals: Dean's to set, the client's to read.
create policy "read own food plan" on public.food_plans
  for select using (client_id = auth.uid() or public.is_admin());
create policy "admin writes food plans" on public.food_plans
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own food plan meals" on public.food_plan_meals
  for select using (
    public.is_admin()
    or exists (select 1 from public.food_plans p where p.id = food_plan_id and p.client_id = auth.uid())
  );
create policy "admin writes food plan meals" on public.food_plan_meals
  for all using (public.is_admin()) with check (public.is_admin());

-- Food logs: the client's own record of the day.
create policy "read own food logs" on public.food_logs
  for select using (client_id = auth.uid() or public.is_admin());
create policy "write own food logs" on public.food_logs
  for insert with check (client_id = auth.uid() or public.is_admin());
create policy "update own food logs" on public.food_logs
  for update using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());
create policy "delete own food logs" on public.food_logs
  for delete using (client_id = auth.uid() or public.is_admin());

-- Weight entries.
create policy "read own weight" on public.weight_entries
  for select using (client_id = auth.uid() or public.is_admin());
create policy "write own weight" on public.weight_entries
  for insert with check (client_id = auth.uid() or public.is_admin());
create policy "update own weight" on public.weight_entries
  for update using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());
create policy "delete own weight" on public.weight_entries
  for delete using (client_id = auth.uid() or public.is_admin());

-- Comments: visible to the client they concern and to Dean. A client may only
-- post as themselves; marking as read is an update on their own thread.
create policy "read own comments" on public.comments
  for select using (client_id = auth.uid() or public.is_admin());
create policy "write comments" on public.comments
  for insert with check (
    author_id = auth.uid() and (client_id = auth.uid() or public.is_admin())
  );
create policy "update own comments" on public.comments
  for update using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());
create policy "admin deletes comments" on public.comments
  for delete using (public.is_admin());

-- Plan templates are Dean's own tools. Clients never read them directly —
-- they see the days those plans were used to create.
create policy "admin manages session plans" on public.session_plans
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages session plan items" on public.session_plan_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages day plans" on public.day_plans
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages day plan meals" on public.day_plan_meals
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Promoting Dean to admin
--
-- After Dean signs up (or is invited), run:
--   update public.profiles set role = 'admin' where email = 'dean@…';
-- ---------------------------------------------------------------------------
