-- Triumph Training — members' area schema.
--
-- Run against a fresh Supabase project (SQL editor, or `supabase db push`).
-- Everything is per-client and private between that client and Dean, enforced
-- in the database by row level security rather than only in the UI.

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('client', 'admin');
-- What an account is to Dean.
--
-- 'basic' is somebody who made an account and nothing more: they can sign in
-- and look round, they are not waiting on him, and they are not one of his
-- clients. 'applicant' has asked to train and is waiting. 'active' is a client
-- he has taken on. Keeping the first apart from the other two is what stops
-- every self-signup landing in his client list or his requests inbox.
create type public.client_status as enum ('basic', 'applicant', 'active', 'paused');

-- Who builds this client's food week. 'coach' is the default and how most
-- clients are coached: Dean assigns the meals and they follow the plan. 'self'
-- hands the slot editor to the client, still against the targets Dean sets.
-- The mode decides who may edit and nothing else — every downstream read is
-- identical either way.
create type public.food_mode as enum ('coach', 'self');

-- How somebody is coached. 'online' is most people; 'one_to_one' is somebody
-- Dean also trains in person, who gets everything an online client gets plus
-- sessions in the diary. It changes what he books, not what they can use.
create type public.coaching_mode as enum ('online', 'one_to_one');

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null default '',
  email       text,
  role        public.user_role not null default 'client',
  status      public.client_status not null default 'active',
  goal        text,
  started_on  date not null default current_date,
  food_mode   public.food_mode not null default 'coach',
  coaching_mode public.coaching_mode not null default 'online',
  -- A photo if there is one. Storage is not wired up yet, so this holds a URL
  -- Dean pastes in; swapping it for a Supabase Storage path changes nothing
  -- above it.
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Who is a coach.
--
-- An allowlist rather than a flag anybody can set: role decides what every
-- policy below lets you read, so it must not be something a signup can ask
-- for. Adding a second coach is one insert here and their next sign-in.
create table public.coach_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);

insert into public.coach_emails (email) values ('fosterdean127@icloud.com');

-- Every new auth user gets a profile.
--
-- Two kinds of person arrive here. Somebody on the coach allowlist is a coach,
-- active immediately. Everybody else signs up through /join and lands as an
-- **applicant**: a real account they can sign into, with no plan behind it and
-- no place in Dean's client list until he enrols them from the requests inbox.
-- That is what keeps a new coach's dashboard empty rather than filling up with
-- everyone who has ever filled the form in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_coach boolean;
begin
  select exists (
    select 1 from public.coach_emails c
    where lower(c.email) = lower(new.email)
  ) into is_coach;

  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when is_coach then 'admin' else 'client' end::public.user_role,
    case when is_coach then 'active' else 'basic' end::public.client_status
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
  -- Sessions are Dean in the room. Online clients have none of these; their
  -- coaching is the workouts and food plans assigned to them.
  location         text not null default 'Newcastle upon Tyne',
  status           public.session_status not null default 'scheduled',
  coach_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index sessions_client_starts_idx on public.sessions (client_id, starts_at desc);

-- ---------------------------------------------------------------------------
-- Workouts — a checklist of criteria Dean sets, ticked off by the client
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Libraries
--
-- Built once, shared across every client. A plan references a library item
-- rather than copying it, so a correction reaches every future day at once.
-- Completed logs snapshot what they need, so history never moves underneath
-- anyone — the exception is meal method text, which is instructional rather
-- than tracked data and is always read live.
--
-- Nothing is hard deleted: archiving keeps past logs readable and lets a plan
-- still using the item be flagged rather than silently broken.
-- ---------------------------------------------------------------------------

create table public.exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  muscle_group text,
  equipment    text,
  -- Optional coaching cue, shown to the client while they train.
  how_to       text,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index exercises_name_idx on public.exercises (lower(name));

create type public.meal_tag as enum ('breakfast', 'lunch', 'dinner', 'snack');

create table public.meals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  tag         public.meal_tag not null default 'lunch',
  -- Per single serving. A plan slot scales these by its multiplier.
  calories    int,
  protein_g   int,
  carbs_g     int,
  fat_g       int,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create index meals_tag_idx on public.meals (tag, calories);

-- Split into quantity and unit so a shopping list can scale by a client's
-- multiplier and merge the same ingredient across meals into one line. Both of
-- those need the unit, so a quantity is never stored without one — the unit is
-- a closed list in the app (see UNITS), with "whole" covering a banana or an
-- egg. Rows that predate the rule are flagged in the library rather than
-- silently dropped:
--   select m.name, i.name from meal_ingredients i
--     join meals m on m.id = i.meal_id
--    where i.quantity is not null and i.unit is null;
create table public.meal_ingredients (
  id       uuid primary key default gen_random_uuid(),
  meal_id  uuid not null references public.meals(id) on delete cascade,
  position int not null default 0,
  name     text not null,
  quantity numeric(8, 2),
  unit     text
);

create index meal_ingredients_meal_idx on public.meal_ingredients (meal_id, position);

-- The method carries no quantities — every amount lives in meal_ingredients,
-- where it can be scaled. That is also why steps are safe to edit in place:
-- fixing a wrong instruction should reach everyone, including on a day they
-- have already cooked it.
create table public.meal_steps (
  id       uuid primary key default gen_random_uuid(),
  meal_id  uuid not null references public.meals(id) on delete cascade,
  position int not null default 0,
  body     text not null
);

create index meal_steps_meal_idx on public.meal_steps (meal_id, position);

-- ---------------------------------------------------------------------------
-- Workouts — what was asked for, and what actually happened
-- ---------------------------------------------------------------------------

create table public.workouts (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  scheduled_for date not null,
  title         text not null default 'Workout',
  -- Optional. Set it and the client sees a suggested time; leave it null and
  -- the workout is simply due that day, whenever suits them.
  suggested_time time,
  coach_notes   text,
  -- The client's own note: how it felt, weights used.
  client_note   text,
  -- 5 (💪) down to 1 (👎), asked once the workout is finished.
  feeling       int check (feeling between 1 and 5),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (client_id, scheduled_for)
);

create index workouts_client_date_idx on public.workouts (client_id, scheduled_for desc);

-- One row per exercise in a workout. `label`, `muscle_group` and `equipment`
-- are a snapshot taken when the day was written: renaming a library exercise
-- tidies future plans and never rewrites what someone already did.
create table public.workout_items (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references public.workouts(id) on delete cascade,
  position     int not null default 0,
  label        text not null,
  -- Optional target, e.g. "3 x 5 @ 80kg". Legacy free-text days still use it;
  -- days built from the library carry per-set targets in workout_sets instead.
  target       text,
  exercise_id  uuid references public.exercises(id) on delete set null,
  muscle_group text,
  equipment    text,
  -- Set when the client passed on it, with their reason.
  skipped_reason text,
  done         boolean not null default false,
  done_at      timestamptz
);

create index workout_items_workout_idx on public.workout_items (workout_id, position);
create index workout_items_exercise_idx on public.workout_items (exercise_id);

-- What the client was asked to lift, and what they actually lifted. Both are
-- kept: the gap between them is the whole progression signal.
create table public.workout_sets (
  id               uuid primary key default gen_random_uuid(),
  workout_item_id  uuid not null references public.workout_items(id) on delete cascade,
  position         int not null default 0,
  target_weight_kg numeric(6, 2),
  target_reps      int,
  actual_weight_kg numeric(6, 2),
  actual_reps      int,
  done_at          timestamptz
);

create index workout_sets_item_idx on public.workout_sets (workout_item_id, position);

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
-- Anything eaten off the plan. Macros are optional on purpose: someone who
-- knows them keeps the day's breakdown honest, and someone who does not should
-- still log the calories rather than log nothing at all.
create table public.food_logs (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  logged_for date not null default current_date,
  calories   int not null,
  protein_g  int,
  carbs_g    int,
  fat_g      int,
  note       text,
  created_at timestamptz not null default now()
);

create index food_logs_client_date_idx on public.food_logs (client_id, logged_for desc);

-- What the client ticked off their plan. A snapshot, so editing a meal in the
-- library never changes what someone ate — except the method, which is read
-- live through meal_id.
create table public.meal_logs (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  logged_for date not null default current_date,
  slot       public.meal_tag not null,
  meal_id    uuid references public.meals(id) on delete set null,
  name       text not null,
  multiplier numeric(3, 2) not null default 1,
  calories   int,
  protein_g  int,
  carbs_g    int,
  fat_g      int,
  created_at timestamptz not null default now(),
  unique (client_id, logged_for, slot, meal_id)
);

create index meal_logs_client_date_idx on public.meal_logs (client_id, logged_for desc);

-- How the eating went, asked the same way a workout asks.
create table public.food_day_feedback (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  logged_for date not null,
  feeling    int check (feeling between 1 and 5),
  note       text,
  created_at timestamptz not null default now(),
  unique (client_id, logged_for)
);

-- ---------------------------------------------------------------------------
-- Submitted days
--
-- The client's own full stop on a day: workout finished, meals ticked, weight
-- in. Everything is already saved by the time they press it, so this stores
-- nothing new — it is the moment they say "that is me done", and the thing
-- Dean can scan at the weekly review to see who is closing their days out.
-- ---------------------------------------------------------------------------

-- A day can be closed out with things still outstanding — the ingredients were
-- not in, breakfast went on the school run. Refusing would only teach the
-- client to tick what they did not eat, so the day closes either way and what
-- was missed is recorded with it.
--
-- Both columns are a snapshot taken at the moment they pressed finish: ticking
-- a meal the next morning must not rewrite what they told Dean.
create table public.day_submissions (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.profiles(id) on delete cascade,
  on_date      date not null,
  submitted_at timestamptz not null default now(),
  missed       text[] not null default '{}',
  note         text,
  -- A reason is the whole point of allowing an incomplete day through.
  constraint day_submissions_missed_needs_note
    check (cardinality(missed) = 0 or note is not null),
  unique (client_id, on_date)
);

create index day_submissions_client_idx on public.day_submissions (client_id, on_date desc);

-- ---------------------------------------------------------------------------
-- Shopping lists
--
-- A list is a snapshot taken when the client presses create, not a live view
-- of the plan: they are standing in a shop, and the aisle they are in should
-- not change because Dean edited next Tuesday.
--
-- Order is theirs to set — supermarkets are not laid out alphabetically — and
-- the order they leave a list in is reused for the next one, so the layout of
-- their shop is learned rather than re-entered.
-- ---------------------------------------------------------------------------

create table public.shopping_lists (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  -- The stretch it was built to cover.
  from_date  date not null,
  to_date    date not null,
  created_at timestamptz not null default now()
);

create index shopping_lists_client_idx on public.shopping_lists (client_id, created_at desc);

create table public.shopping_list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.shopping_lists(id) on delete cascade,
  position   int not null default 0,
  name       text not null,
  quantity   numeric(8, 2),
  unit       text,
  -- Which meals it is for, denormalised because the list is a snapshot.
  used_in    text,
  checked_at timestamptz
);

create index shopping_list_items_list_idx on public.shopping_list_items (list_id, position);

-- ---------------------------------------------------------------------------
-- Plans
--
-- Editing "all future Mondays" inserts a revision with effective_from and no
-- only_on. Editing "just this day" inserts one with only_on set. Neither is
-- ever dated before today, so a past date always resolves to what was true at
-- the time, and a day nothing has been written for is a rest day.
-- ---------------------------------------------------------------------------

create type public.plan_kind as enum ('workout', 'food');

-- A plan is a pile of days. Each row either stands for its weekday from
-- effective_from onwards (only_on null) or belongs to one date alone
-- (only_on set), and the second kind always wins when both could apply.
--
-- That single rule is the whole of the recurrence: saving "every Monday from
-- here" cannot reach back over a Monday somebody already pinned to its date,
-- so a week built by hand is never quietly overwritten. There is no block, no
-- cycle length and no start date to keep in step with the calendar.
create table public.plan_day_revisions (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles(id) on delete cascade,
  -- 0 = Monday .. 6 = Sunday, matching every screen that draws a week.
  weekday        smallint not null check (weekday between 0 and 6),
  kind           public.plan_kind not null,
  effective_from date not null,
  -- Set for a day written for a single date, which beats any effective_from.
  only_on        date,
  -- The date a pinned day is for has to be that weekday, or it would resolve
  -- on a date it was never meant for.
  constraint plan_day_revisions_only_on_weekday
    check (only_on is null or (extract(isodow from only_on) - 1) = weekday),
  -- Workout side.
  title          text,
  suggested_time time,
  coach_notes    text,
  -- Food side. Either may be null — a day can be a target, meals, or both.
  calorie_target int,
  protein_target int,
  -- A cleared day is an empty revision rather than a missing one, so "Dean
  -- made this a rest day" is distinguishable from "never set".
  is_rest        boolean not null default false,
  created_at     timestamptz not null default now()
);

create index plan_day_revisions_lookup_idx
  on public.plan_day_revisions (client_id, kind, weekday, effective_from desc);
create index plan_day_revisions_only_on_idx
  on public.plan_day_revisions (client_id, kind, only_on);

create table public.plan_exercises (
  id          uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.plan_day_revisions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  position    int not null default 0,
  notes       text
);

create index plan_exercises_revision_idx on public.plan_exercises (revision_id, position);

-- One row per set, because sets differ: 10 / 8 / 6 up a weight ladder is the
-- normal case, not the exception.
create table public.plan_sets (
  id               uuid primary key default gen_random_uuid(),
  plan_exercise_id uuid not null references public.plan_exercises(id) on delete cascade,
  position         int not null default 0,
  target_weight_kg numeric(6, 2),
  target_reps      int
);

create index plan_sets_exercise_idx on public.plan_sets (plan_exercise_id, position);

create table public.plan_meal_slots (
  id          uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.plan_day_revisions(id) on delete cascade,
  slot        public.meal_tag not null,
  position    int not null default 0,
  meal_id     uuid not null references public.meals(id) on delete cascade,
  -- 0.5, 1, 1.5 or 2. Scales calories, macros and ingredient quantities.
  multiplier  numeric(3, 2) not null default 1 check (multiplier > 0)
);

-- ---------------------------------------------------------------------------
-- Ingredient swaps
--
-- The meal library is shared, so correcting a recipe there reaches every
-- client — which is the point, and exactly why it is the wrong place to record
-- that one person does not want salmon.
--
-- A swap belongs to the client, not to the recipe and not to a plan revision:
-- a revision is rewritten every time the day is saved and would take the swap
-- with it. Scope works the same way as a plan edit — `only_on` pins it to a
-- single date, otherwise it applies from `effective_from` onwards, so a change
-- made for next Tuesday leaves this Tuesday alone.
--
-- Matched on the ingredient's name, not its id: library ingredients are
-- deleted and re-created whenever a meal is edited, so an id would stop
-- matching while still looking correct.
-- ---------------------------------------------------------------------------

create table public.client_meal_swaps (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles(id) on delete cascade,
  -- Null means every meal that uses the ingredient: "no salmon, anywhere".
  meal_id        uuid references public.meals(id) on delete cascade,
  replaces       text not null,
  -- Null removes the ingredient rather than replacing it.
  name           text,
  -- Per single serving, like every other amount, so a portion still scales it.
  quantity       numeric(8, 2),
  unit           text,
  effective_from date not null default current_date,
  only_on        date,
  created_at     timestamptz not null default now()
);

create index client_meal_swaps_client_idx
  on public.client_meal_swaps (client_id, effective_from desc);

create index plan_meal_slots_revision_idx on public.plan_meal_slots (revision_id, slot, position);

-- ---------------------------------------------------------------------------
-- Questions
--
-- A one-off ask from the website's contact form. Not an application: somebody
-- wanting to know whether Dean coaches runners has not applied to train, and
-- one list holding both would make both useless.
-- ---------------------------------------------------------------------------

create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  body        text not null,
  created_at  timestamptz not null default now(),
  answered_at timestamptz
);

create index questions_open_idx on public.questions (answered_at, created_at desc);

-- ---------------------------------------------------------------------------
-- Applications
--
-- The public signup wizard. No plan to pick and no price to choose, because
-- there is no shelf of programmes — Dean builds one per person, so this is an
-- application he reads rather than a purchase somebody makes.
--
-- The answers live here rather than on the profile so they stay as they were
-- given: editing somebody's goal a month in should not rewrite what they said
-- when they applied.
-- ---------------------------------------------------------------------------

create type public.goal_type as enum ('muscle', 'lose', 'fitness', 'other');
create type public.application_status as enum ('pending', 'approved', 'declined');

create table public.applications (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.profiles(id) on delete cascade,
  full_name         text not null,
  email             text not null,
  avatar_url        text,
  -- Both optional: "if you know it" is why they are asked this way.
  current_weight_kg numeric(5, 1),
  goal_weight_kg    numeric(5, 1),
  goal_type         public.goal_type not null default 'fitness',
  goal_other        text,
  status            public.application_status not null default 'pending',
  created_at        timestamptz not null default now(),
  decided_at        timestamptz
);

create index applications_status_idx on public.applications (status, created_at desc);

-- Where Stripe lands. Deliberately not written yet — enrolling and paying are
-- separate steps today, and the placeholder in the UI says so. When it is
-- wired up, a successful checkout writes here and enrolment reads it.
--   alter table public.applications add column paid_at timestamptz;
--   alter table public.applications add column stripe_checkout_id text;

-- ---------------------------------------------------------------------------
-- Day swap requests
--
-- A client asking to move a session to another day. A request rather than a
-- change: the plan is coaching, so only Dean's approval moves anything.
-- ---------------------------------------------------------------------------

create type public.swap_status as enum ('pending', 'approved', 'declined');

create table public.day_swap_requests (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  from_date  date not null,
  to_date    date not null,
  -- Snapshotted so the request still reads after the plan has moved on.
  title      text,
  reason     text,
  status     public.swap_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  check (from_date <> to_date)
);

create index day_swap_requests_client_idx
  on public.day_swap_requests (client_id, status, from_date);

-- ---------------------------------------------------------------------------
-- Check-ins
--
-- The weekly rhythm. Dean reviews a client's last stretch, decides whether the
-- plan carries on or changes, writes them a note, and sets when to look again.
-- One row per decision, so the history of a client's coaching is readable.
-- ---------------------------------------------------------------------------

create type public.check_in_outcome as enum ('continued', 'adjusted');

create table public.check_ins (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles(id) on delete cascade,
  coach_id       uuid not null references public.profiles(id) on delete cascade,
  -- The stretch Dean was looking at when he made the call.
  period_start   date not null,
  period_end     date not null,
  outcome        public.check_in_outcome not null,
  -- What he told the client. Also copied into `comments` so it lands in their
  -- "new from Dean" alongside everything else he writes.
  note           text not null,
  -- How many weeks forward this check-in wrote. 0 when nothing needed adding.
  weeks_planned  int not null default 0,
  -- Drives the board's ordering: whoever is due soonest sits at the top.
  next_review_on date not null,
  created_at     timestamptz not null default now()
);

create index check_ins_client_idx on public.check_ins (client_id, created_at desc);
create index check_ins_due_idx    on public.check_ins (next_review_on);

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

create type public.comment_target as enum (
  'workout', 'food_log', 'weight_entry', 'session', 'check_in'
);

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
alter table public.check_ins          enable row level security;
alter table public.exercises          enable row level security;
alter table public.meals              enable row level security;
alter table public.meal_ingredients   enable row level security;
alter table public.meal_steps         enable row level security;
alter table public.workout_sets       enable row level security;
alter table public.meal_logs          enable row level security;
alter table public.food_day_feedback  enable row level security;
alter table public.plan_day_revisions enable row level security;
alter table public.plan_exercises     enable row level security;
alter table public.plan_sets          enable row level security;
alter table public.plan_meal_slots    enable row level security;
alter table public.client_meal_swaps  enable row level security;
alter table public.day_submissions    enable row level security;
alter table public.shopping_lists     enable row level security;
alter table public.shopping_list_items enable row level security;
-- Added later than the rest and easy to forget: a policy on a table without
-- RLS enabled is inert, so these three were readable by anyone holding the
-- anon key — which for applications and questions means names and emails.
alter table public.applications       enable row level security;
alter table public.questions          enable row level security;
alter table public.day_swap_requests  enable row level security;
-- No policy on purpose: only `handle_new_user` touches this, and it is
-- SECURITY DEFINER so it bypasses RLS. With RLS on and nothing granted, the
-- list of who can be a coach is invisible to every client of the API.
alter table public.coach_emails       enable row level security;

-- Profiles
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
-- The coach's own row is readable by anyone signed in, because his name is on
-- every note and comment they read. Without this the client's app joins to a
-- row it cannot see and Dean's replies arrive unsigned.
create policy "read the coach" on public.profiles
  for select using (role = 'admin');
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

-- Questions: anyone may ask one, including a visitor who is not signed in.
-- Only Dean reads them — an open inbox anybody could read would be a leak of
-- everyone else's email address.
create policy "anyone asks a question" on public.questions
  for insert with check (true);
create policy "admin reads questions" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

-- Applications: somebody reads and raises their own, and only Dean decides one.
-- An applicant who could approve their own application would not be applying.
create policy "read own application" on public.applications
  for select using (account_id = auth.uid() or public.is_admin());
create policy "raise own application" on public.applications
  for insert with check (account_id = auth.uid() and status = 'pending');
create policy "admin decides applications" on public.applications
  for update using (public.is_admin()) with check (public.is_admin());

-- Day swaps: the client raises and reads their own requests, and may withdraw
-- one while it is still pending. Deciding it is Dean's alone — a client who
-- could approve their own request would not be making a request.
create policy "read own swap requests" on public.day_swap_requests
  for select using (client_id = auth.uid() or public.is_admin());
create policy "client raises swap requests" on public.day_swap_requests
  for insert with check (client_id = auth.uid() and status = 'pending');
create policy "client withdraws pending swaps" on public.day_swap_requests
  for delete using (client_id = auth.uid() and status = 'pending');
create policy "admin decides swap requests" on public.day_swap_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- Check-ins: the client reads their own history — the note is written to them —
-- but only Dean records one.
create policy "read own check ins" on public.check_ins
  for select using (client_id = auth.uid() or public.is_admin());
create policy "admin records check ins" on public.check_ins
  for all using (public.is_admin()) with check (public.is_admin());

-- Libraries: everyone signed in can read them, because a client needs the
-- exercise cue while they train and the method while they cook. Only Dean
-- writes.
create policy "read exercises" on public.exercises
  for select using (auth.uid() is not null);
create policy "admin manages exercises" on public.exercises
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read meals" on public.meals
  for select using (auth.uid() is not null);
create policy "admin manages meals" on public.meals
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read meal ingredients" on public.meal_ingredients
  for select using (auth.uid() is not null);
create policy "admin manages meal ingredients" on public.meal_ingredients
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read meal steps" on public.meal_steps
  for select using (auth.uid() is not null);
create policy "admin manages meal steps" on public.meal_steps
  for all using (public.is_admin()) with check (public.is_admin());

-- Sets belong to a workout item, which belongs to a workout, which is the row
-- that actually carries the client. The client logs what they lifted, so they
-- may update their own; only Dean sets the targets.
create policy "read own workout sets" on public.workout_sets
  for select using (
    exists (
      select 1 from public.workout_items i
      join public.workouts w on w.id = i.workout_id
      where i.id = workout_item_id and (w.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "log own workout sets" on public.workout_sets
  for update using (
    exists (
      select 1 from public.workout_items i
      join public.workouts w on w.id = i.workout_id
      where i.id = workout_item_id and (w.client_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.workout_items i
      join public.workouts w on w.id = i.workout_id
      where i.id = workout_item_id and (w.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "admin writes workout sets" on public.workout_sets
  for insert with check (public.is_admin());
create policy "admin deletes workout sets" on public.workout_sets
  for delete using (public.is_admin());

-- Meal ticks and the food day's rating are the client's own record.
create policy "read own meal logs" on public.meal_logs
  for select using (client_id = auth.uid() or public.is_admin());
create policy "write own meal logs" on public.meal_logs
  for all using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());

create policy "read own food feedback" on public.food_day_feedback
  for select using (client_id = auth.uid() or public.is_admin());
create policy "write own food feedback" on public.food_day_feedback
  for all using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());

-- The plan: the client reads theirs, Dean writes everyone's. The nested
-- tables reach the client through the day they belong to.
create policy "read own plan revisions" on public.plan_day_revisions
  for select using (client_id = auth.uid() or public.is_admin());
create policy "admin manages plan revisions" on public.plan_day_revisions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own plan exercises" on public.plan_exercises
  for select using (
    exists (
      select 1 from public.plan_day_revisions r
      where r.id = revision_id and (r.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "admin manages plan exercises" on public.plan_exercises
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own plan sets" on public.plan_sets
  for select using (
    exists (
      select 1 from public.plan_exercises e
      join public.plan_day_revisions r on r.id = e.revision_id
      where e.id = plan_exercise_id and (r.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "admin manages plan sets" on public.plan_sets
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read own plan meal slots" on public.plan_meal_slots
  for select using (
    exists (
      select 1 from public.plan_day_revisions r
      where r.id = revision_id and (r.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "admin manages plan meal slots" on public.plan_meal_slots
  for all using (public.is_admin()) with check (public.is_admin());

-- A swap is Dean's coaching decision, so only he writes it. The client reads
-- their own, because it is what their meals actually say.
create policy "read own meal swaps" on public.client_meal_swaps
  for select using (client_id = auth.uid() or public.is_admin());
create policy "admin manages meal swaps" on public.client_meal_swaps
  for all using (public.is_admin()) with check (public.is_admin());

-- Only the client closes their own day; Dean reads it.
create policy "read own day submissions" on public.day_submissions
  for select using (client_id = auth.uid() or public.is_admin());
create policy "submit own day" on public.day_submissions
  for all using (client_id = auth.uid()) with check (client_id = auth.uid());

-- A shopping list is the client's own. Dean can see one if he needs to, but it
-- is not something he writes.
create policy "own shopping lists" on public.shopping_lists
  for all using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid());

create policy "own shopping list items" on public.shopping_list_items
  for all using (
    exists (
      select 1 from public.shopping_lists l
      where l.id = list_id and (l.client_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.shopping_lists l where l.id = list_id and l.client_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Avatars
--
-- A real upload rather than a pasted URL. Public read, because an avatar is
-- shown on screens the browser loads directly; writes are scoped to a folder
-- named after the person, so nobody can overwrite somebody else's face.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "avatars are public" on storage.objects
  for select using (bucket_id = 'avatars');

-- The first path segment is the owner's id, so "my folder" is a prefix check.
create policy "upload own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "replace own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "delete own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Adding a coach
--
-- Roles come from the allowlist at the top of this file, applied when the auth
-- user is created. To add another coach:
--   insert into public.coach_emails (email) values ('someone@…');
-- They become a coach on their next sign-up. Somebody who already has an
-- account needs both:
--   update public.profiles set role = 'admin', status = 'active'
--    where email = 'someone@…';
-- ---------------------------------------------------------------------------
