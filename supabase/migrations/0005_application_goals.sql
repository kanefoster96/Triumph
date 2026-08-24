-- More than one goal per application.
--
-- "Lose weight" and "build muscle" is the normal answer, not an unusual one,
-- and a single enum made people pick the half of it that mattered least.
--
-- `goal_type` stays. It is not null, every row written before today has one,
-- and it now holds the first of `goal_types` — so anything still reading a
-- single goal reads the headline one rather than nothing. `goal_types` is what
-- the application layer treats as the answer.
alter table public.applications add column goal_types public.goal_type[];

-- Existing rows answered with exactly one.
update public.applications set goal_types = array[goal_type] where goal_types is null;

comment on column public.applications.goal_types is
  'Every goal they picked. goal_type mirrors the first of these for older readers.';
