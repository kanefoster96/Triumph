# Roadmap — trainer planning tools

**Built so far:** layer 2 (templates) and layer 3 (assignment). Dean creates
workout and food plans on `/admin/plans` and paints them across a date range
with weekday selection from a client's Workouts or Food tab. Still to come:
the libraries underneath them, calorie auto-fill, progression memory and
shopping lists.

Agreed spec, not yet built. The principle: **build once, assign many times.**
Three layers, so the daily job takes seconds rather than minutes.

## 1. Libraries (build once)

**Meal library** — reusable meals: name, ingredients, calories, tagged
breakfast / lunch / dinner / snack. Filterable by calories and tag.

**Exercise library** — reusable exercises: name, muscle group, equipment.
Searchable.

Dean adds to these over time; after a few weeks he rarely creates anything new.

## 2. Templates (group library items)

**Session plans** — named templates grouping exercises, each with sets, reps
and weight fields. "Push Day" exists as a reusable block.

**Day plans (food)** — meals adding up to a calorie total. "1,800 kcal Day A"
exists as a reusable block.

## 3. Assignment (the daily job)

Dean picks a client, picks a date range of up to 30 days, and drops templates
onto days. A **repeat weekly** option fills the whole range from one week's
pattern. Individual days are then editable without affecting the rest.

## The two things that make it genuinely faster

**Calorie auto-fill.** Dean enters the client's daily target, filters the meal
library, and the system suggests a breakfast/lunch/dinner combination near that
number. He swaps anything he does not like. He can also assign a calorie target
only, with no meals.

**Progression memory.** When assigning a session plan, each exercise shows that
client's last logged weight and reps beside the new target field. Dean bumps the
number or taps "+2.5kg". Clients log actual weight and reps completed against
each exercise, which feeds the next assignment. Over time this is the whole
progression system.

## Shopping list

Auto-generated per client per week from the ingredients of their assigned
meals, visible to the client.

## Notes on fit with what exists

- `workouts` / `workout_items` already hold an assigned session and its
  checklist. Session plans become a template table those are instantiated from,
  and `workout_items` needs `sets`, `reps`, `weight` plus logged actuals to
  support progression memory.
- `food_plans` / `food_plan_meals` already hold an assigned day. Day plans
  become the reusable template, and meals move into a library table that both
  reference.
- Assignment needs a date-range writer that instantiates templates per day,
  which is the piece that does not exist at all yet.

Suggested order: libraries → templates → assignment with repeat-weekly →
progression memory → calorie auto-fill → shopping list.
