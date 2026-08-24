-- Whether an applicant has a gym, and which one.
--
-- The workouts Dean writes are gym workouts, so this is the one thing the
-- application asks that changes whether the coaching can work at all. Two
-- columns rather than one, because "no gym" and "never asked" are different
-- answers and only the first is a decision: every application written before
-- this migration has has_gym null, and Dean's inbox says "Not asked" for
-- those rather than pretending they said no.
alter table public.applications add column has_gym  boolean;
alter table public.applications add column gym_name text;

comment on column public.applications.has_gym is
  'true = has a membership, false = told they will need one, null = asked before the question existed.';
