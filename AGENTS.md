<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Triumph Training — project notes

Marketing website for a personal trainer. Next.js 16 App Router, React 19,
Tailwind v4, TypeScript. Fully static; no backend.

## Ground rules

- **Content is data, not markup.** All copy lives in `src/lib/data/`. Do not
  hard-code names, prices, or client stories into components.
- **`src/lib/` stays portable.** These features become a React Native app, so
  `lib/types.ts`, `lib/data/*`, `lib/services/*`, `lib/theme/tokens.ts` and
  `lib/utils.ts` must not import React or touch the DOM.
- **`src/lib/services/content.ts` is the only data seam.** Components call it;
  swapping mock data for an API should touch that file alone.
- **Tokens are mirrored** in `lib/theme/tokens.ts` and `app/globals.css`
  (`@theme`). Change both together.
- Prefer semantic colour utilities (`bg-surface`, `text-muted`, `border-line`)
  over raw hex.
- The look is minimal and dark: the page is true black, surfaces are flat,
  whitespace is generous and there is one cyan accent. No gradients, texture
  overlays, glows, or condensed/uppercase display type — small labels are
  sentence case, not tracked capitals. The only saturated block on a page is
  the accent CTA band.
- **Tone separates, not lines.** Each layer is a step up from the one under it:
  `ink` (the page) → `surface` (a card) → `raised` (a row or control inside a
  card) → `overlay` (a control inside a row). Something nested must always sit
  one step *above* its parent, never level with it or below — level is
  invisible, below reads as a hole. Four levels is the whole ramp, so if you
  need a fifth, the layout is too deep.
- Cards use `bg-surface` and `rounded-[var(--radius-sheet)]` with **no border**;
  a card's visual identity comes from an `IconTile`, not from imagery or an
  outline. Images and avatars carry no border either.
- `border-line` is for genuine rules only — the underside of a sticky header, a
  sheet's pinned header and footer, separators between list rows. Never to
  outline a card, a control, a field or a callout. A tinted callout is its tint
  alone (`bg-amber/10`), a filled control its fill (`bg-raised`).
- Fields are filled, not outlined, and set no `focus:outline-none`: the base
  `:focus-visible` rule in `globals.css` is their focus ring. The one exception
  to all of this is an empty checkbox, which has nothing but a line to show.

## Navigation

The website navigates with the hamburger menu in `MobileMenu` (mobile) and the
inline links in `TopBar` (desktop). `BottomTabBar` is the **app's** navigation,
kept as a working reference and deliberately not mounted on the site — both it
and the header read the same `nav` array from `site.ts`.

## Members' area

`/app` (client) and `/admin` (Dean) are the logged-in product — see MEMBERS.md.
Reads go through `lib/members/service.ts`, writes through
`lib/members/actions.ts`, and both fall back to `lib/members/demo.ts` when
Supabase is not configured. Privacy is enforced by row level security in
`supabase/migrations/0001_init.sql`, not by UI checks: add a policy for every
new table.

Marketing pages live in the `(marketing)` route group with their own layout;
the root layout is only the document shell.

`/admin/clients/[slug]` is tabbed: Overview, **Plan**, Sessions, What they did,
Weight. Plan is the only place a day is changed, training and food together, so
there is no second editor to keep in step with it. "What they did" is read
only. Any screen showing a day must resolve it the way the client's app does —
`getWorkoutFor`, `getPlanDay` and `getTrainingDates`, never a raw
`getWorkouts`, which returns logged rows only and so reports planned days as
empty.

**A plan is a pile of days.** There is no block, no cycle length and no start
date. Each revision in `plan_day_revisions` either stands for its weekday from
`effective_from` onwards (`only_on` null) or belongs to one date alone
(`only_on` set), and `pickRevision` always prefers the second. That single rule
is the whole of the recurrence: saving "all future Mondays" cannot reach back
over a Monday somebody already pinned, so a week built by hand is never quietly
overwritten. A date nothing has been written for is a **rest day** — `getPlanDay`
never returns null, and nothing is "before the plan starts" any more.

Weekdays are Monday-first (`weekdayOf`: 0 = Monday), because that is how every
screen draws a week.

The Plan tab is a **list of days**: `getPlanDays` resolves a run of dates, each
collapsed to one line ("Mon 25 Aug · Lower body · 1,950 kcal"), and the open
day expands in place. Every save asks one question in a popup — **just this
day**, or **all future Mondays**. `savePlanDay` takes `kind=both` so training
and food commit together; a screen with two Save buttons is a day half-written.
Saving to a weekday also pins that date, or the day being edited would be the
only one that did not change.

Each half of a day offers three ways to fill it, on every day: **Copy last
Monday** (`copyLastLike`, sourced by `findLastLike`), **From another client**,
**Start blank** (a `?blank=` link, so no second copy of the editor is
rendered). None of them may be a `<form>` — they sit inside the day's own form.

The list is built to be used one-handed. On a phone the day editor is a
full-height sheet with the day at the top and Save pinned to the bottom edge
(`useIsPhone` picks the layout — the two are never both rendered, or every
field would submit twice); exercises are an accordion, one open at a time;
weights and reps have `NumberStepper` buttons so building a session does not
mean thirty taps into a numeric keypad; and every library choice is a
`PickerSheet` with search rather than a `<select>`, because these libraries are
meant to grow. Controls in these flows are 44px.

Nothing anywhere parses free text into sets, reps, portions or calories.
Workouts and meals are built from library ids and number fields, and that is
deliberate: the Templates page that did parse text is gone, replaced by "from
another client", which copies a day Dean already built. If you find
yourself adding a textarea, it is for prose — a note, a cue, a method step —
never for structure.

`/admin` opens on a compliance grid (`getComplianceBoard`): one row per client,
one column per day, three marks per day for training, food and weight. A day
with nothing on it asks nothing and is never scored, and a day that has not
happened is shown but never judged.

The check-in board never says how far ahead a plan reaches, because a plan does
not run out. The only thing worth flagging is a client with nothing planned at
all.

Notes the client leaves — after training, on their food, with a weigh-in —
surface on the plan day they belong to as a collapsed "Left you a note" chip
(`getNotesBetween`, `DayNotes`). Replying (`replyToNote`) posts a comment on the
row they wrote it on, so they read the answer under their own words.

The Sessions tab is for 1-to-1 clients. An **online** client has no diary, so it
shows their next three weeks of training days instead of an empty booking form.

Demo writes go through `lib/members/demo-store.ts`, not module-level arrays.
The site runs as serverless functions, so a module array is per-instance: a
tick landed in one instance and the next request read another, and the tick
appeared to undo itself. Anything written in demo mode belongs in that cookie
— if you add a new demo write, add it there rather than to a `const` in
`demo.ts`, which is now seed data only.

Workout state is stored there as deltas keyed by id (`itemEdits`, `setEdits`,
`workoutEdits`), never as copies of the workout: five exercises of four sets
would be most of the cookie budget on its own. `withWorkoutEdits` lays them
over whatever produced the workout, seed row or plan. Starting a plan day is
just its id in `startedWorkouts` for the same reason — copying it would also
orphan every tick keyed to the original ids.

The demo store spans two cookies — day-to-day data and the plan — because a
week of food plus three sessions does not fit in one. Sizes are measured on
the percent-encoded value, not the raw JSON: a cookie over ~4KB on the wire is
rejected outright by the browser and the previous one silently kept, which
looks exactly like a save that worked and then vanished. Plan revisions are
stored packed (`packRevision`), with ids rebuilt deterministically on read so
a workout tick keyed to an item id is never orphaned.

The check-in card does not edit anything itself: it links into the real
editors with `?review=1`, which shows `ReviewBanner` (their recent notes plus a
way back) and makes a save redirect to `/admin/checkin#client-<id>`. Anything
that navigates within those pages has to carry the flag, or the notes vanish
mid-edit — see `MonthCalendar`'s `carry` prop.

The meal library is shared, so a recipe edit reaches every client — which is
why a client who does not want salmon gets an **ingredient swap** instead
(`client_meal_swaps`), matched on the ingredient's name and scoped exactly like
a plan edit: one date, or that date onwards. Swaps are applied in `getPlanDay`,
the single seam where a meal meets a person and a date, so the plan editor,
their app, the method page and the shopping list all agree. Anything that reads
a meal outside that seam — the meal detail page, the shopping list builder —
has to call `applySwaps` itself.

Scaled meal amounts are presented to the client as the meal, full stop. No
client-facing text may explain, justify or hint at scaling — no "multiplier",
no "1.5×", no "base amount". Where a client is allowed to choose, it is
labelled **Portion** with fractions.

The public way in is `/join` — a three-step wizard that creates an account and
an `Application`. There is no plan to pick and no price to choose because there
is no shelf of plans: Dean reads the application in `/admin/requests` and
enrols them, which flips the profile from `applicant` to `active` and opens
their week. Coaching is online only on every public surface.

Payment is deliberately a separate, unwired step — `lib/services/payments.ts`
is the seam and the button in the requests inbox says "coming soon" out loud.
Nothing pretends to charge anybody.

Demo accounts made through the signup live in a third cookie
(`triumph-demo-people`), away from the day-to-day and plan stores so a week of
meal ticks can never prune somebody's account away. Passwords are asked for and
never stored: sign-in matches on the email alone, and both screens say so.

Clients can ask to move a session (`day_swap_requests`); Dean answers on his
home page. Approving performs the move — writes the day onto the new date and
rests the old one — because the failure mode worth designing out is him saying
yes and the plan never changing.

## Gotchas

- Custom utilities in `globals.css` sit in the same cascade layer as Tailwind's,
  so a custom class that sets `display` will beat `lg:hidden`. `.rail`
  deliberately omits `display` — pair it with `flex`.
- For the same reason, passing `hidden` to `<Button>` will not override its own
  `inline-flex`; toggle a child `<span>` instead.
- `Reveal` starts elements at `opacity: 0`. A `<noscript>` rule in `layout.tsx`
  pins them visible — keep it if you touch the reveal CSS.
- Reading the clock (`Date.now()`, `new Date()`) during a component render
  trips `react-hooks/purity`. Do it inside an async function in the service
  layer instead — see `partitionSessions`.
- Do not leave a fixed overlay parked off-screen (e.g. a drawer held at
  `translate-x-full`) in the DOM: it interferes with the page's
  scroll-into-view behaviour, and `visibility: hidden` does not help. Mount it
  only while in use. For the same reason, never leave a full-viewport
  `backdrop-filter` applied while the overlay is closed. `BottomSheet` follows
  both rules and portals into `document.body` — it is opened from inside forms
  and cards, and a `<form>` inside a `<form>` is dropped by the browser without
  a word.
- A grid item is sized by its own min-content, and Chrome does not zero a flex
  item's min-content contribution even with `min-w-0` — so a `truncate` line
  (which is `white-space: nowrap`) can push a card past the viewport. Use
  `grid-cols-1` (`minmax(0,1fr)`) plus `min-w-0` on the item.
- Nothing inside a collapsed `<details>` may be `required`: the browser cannot
  focus a hidden field to complain about it and refuses to submit at all. Flag
  what is missing in the UI and drop it server-side.
- Anything rendered inside the day editor that needs to post — a note reply, a
  fill button — must call the server action through `useTransition` rather than
  wrapping itself in a `<form>`. A form inside a form is dropped by the browser
  without a word, and the inner button silently submits the outer one instead.

## Checks

`npm run build` and `npm run lint` should both pass clean before committing.

## The members'-area preview

The marketing site shows the app before the app exists. `MemberTour` is a
tablist over `memberArea`, and each feature carries a `preview` — an
`AppPreview` variant holding only what its screen shows, so a screen is edited
in `lib/data/coaching.ts` rather than in markup.

They are drawings, not screenshots: there are no image assets in this project,
and a screenshot of a screen still being built would age the moment it changed.
Nothing in a preview may tick, send or save, every feature keeps its **In
build** chip, and the caption under the frame says out loud that it is a
preview. A mockup that looked live would be a promise the product cannot keep
yet.

The frame is a fixed height because the screens differ by about 115px and it
jumped on every switch, and the tablist is one element laid out two ways —
a rail on a phone, a column beside the preview above `lg` — because rendering
it twice would put two sets of tabs in the accessibility tree.

On the rail the swipe is the control: cards snap centre, whichever lands in the
middle is previewed, and the preview is the same width and centre as a card so
the two read as one object rather than a picture floating under a list. The
screen cross-fades on change — `shown` lags `active` by one fade so the old
screen leaves before the new one arrives — and swaps instantly under
`prefers-reduced-motion`.

## Goals are people

`lib/data/goals.ts` holds five **people**, not five products: busy parents,
somebody who has dieted before, somebody back after time off, somebody on
shifts, and somebody whose numbers have stopped moving. They are drawn from the
specialties on `coach.ts`, so the about page and the goals never drift apart.

A `Goal` therefore carries no level and no price — everything is the same
monthly coaching — and its three lists answer the three questions a visitor
actually has, in order: `whoFor` (is this me), `howIHelp` (what would you do
about it), `outcomes` (where does it get me). The detail page renders them
under exactly those headings.

Renaming a goal changes its slug, which breaks any link already published, so
retire the old slug with a redirect in `next.config.ts` rather than leaving a
404. `transformations.ts` and `testimonials.ts` both point at goals — the first
by `goalSlug`, which must resolve, the second by `goal`, which is only a label.
