# Members' area

The logged-in product: five client tabs and Dean's admin. Everything is per
client and private between that client and Dean.

## Connecting Supabase

Nothing is wired to a database yet. Until it is, the app runs on the demo
dataset in `src/lib/members/demo.ts` and shows an amber banner saying so.

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (or
   `supabase db push`). It creates every table, the row-level-security
   policies, and the trigger that gives each new auth user a profile.
3. Set two environment variables — locally in `.env.local`, and in Vercel:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```

4. Invite Dean from the Supabase dashboard (Authentication → Users), then
   promote him:

   ```sql
   update public.profiles set role = 'admin' where email = 'dean@…';
   ```

5. Dean invites clients the same way. There is no public signup.

The banner disappears and every read and write switches to Postgres. No code
changes — `src/lib/supabase/config.ts` detects the variables.

## Client tabs

| Tab | What it does |
| --- | --- |
| **Dashboard** `/app` | Next session, today's workout status, calories vs target, latest weight, new comments from Dean. Every card links to its tab, and there is always one clear next step. |
| **Sessions** `/app/sessions` | A month calendar of everything planned, the picked day's detail, then **Coming up** — workouts and any in-person sessions in one list. Past sessions and Dean's notes appear only for clients who train with him in person. |
| **Workouts** `/app/workouts` | Today's workout as a checklist. Ticks apply optimistically; the client adds a note. Past workouts keep their completion state and notes. |
| **Food** `/app/food` | Dean's assigned meals and/or calorie target. Log incrementally or as one end-of-day total, with a running total against target. |
| **Weight** `/app/weight` | Daily entry plus a trend line and history. |

## Trainer

| Screen | What it does |
| --- | --- |
| **Clients** `/admin` | A grid of everyone's week: one row per client, one column per day, three marks a day for training, food and weight, sorted by who needs looking at first. Pending day-swap requests sit above it. A card view with today's numbers is behind a toggle. |
| **Client** `/admin/clients/[id]` | The same tabs the client sees, but editable. Plan is the week board — seven day cards with the editor for the open day underneath, one save for training and food together. Overview mirrors their dashboard and surfaces recent notes; Sessions schedules, edits and cancels; Workouts owns one date with its history; Food sets targets and meals; Weight shows the trend. Dean can reply to any note from its tab. |
| **Check-ins** `/admin/checkin` | The weekly round. Every active client with how their last stretch went, anything they wrote, and how far ahead they are planned — then continue the plan or adjust it, both with a note. |
| **Schedule** `/admin/schedule` | A month calendar of every session across all clients. Pick a day to see it and add to it — client, time, location picker with a free-text override. Anything added shows up in that client's Sessions tab. |

## Calendars

Two things get put on a date, and they are deliberately different.

A **session** is Dean in the room, so it only exists for the Newcastle clients
and is booked from Dean's own **Schedule**: pick the day, then the client, the
time and where it is. It lands on the client's calendar as an accent dot.
Online coaching involves no video call, so an online client has no sessions at
all — their location picker offers places, never "Online", and nothing in the
client UI implies Dean will be on a screen.

A **workout** is the client training alone, so it is assigned from that client's
**Workouts** tab, which shows their calendar. Dean adds a one-off to the picked
day, or uses **Plan ahead** to repeat a plan weekly on chosen weekdays. A
suggested time is optional: give one and the client sees "Suggested 07:00";
leave it blank and it is simply a workout to complete that day, whenever suits
them. Workouts carry a muted dot.

Every calendar is built from links, no client JavaScript. The picked day lives
in the URL (`?month=&date=`), so it survives a refresh and is shareable. The
selected day is filled, today is outlined.

## The weekly round

Planning three or four weeks out only works if something brings Dean back
weekly to check it is still right. **Check-ins** is that screen.

Every active client gets a row: workouts finished against assigned, days food
was logged, average calories against target, weight change, and — the point of
it — everything they wrote in the window, in one place. Anyone with something
worth looking at is flagged with the reason (`2 of 3 workouts not finished`,
`Left a note`, `Plan runs out within a week`, `Review due`) and sorted to the
top; the rest read **On track** and can be skimmed past.

A review is read-then-change, so the card carries **Change something** — three
links into the real editors (the week, workouts, food). Each opens with the
client's recent notes pinned at the top and a way back, keeps that context
while Dean moves between dates, and returns him to the card he was working
through when he saves. Every one of those editors asks the same question in
the same words: just that date, or every week from then on.

Two decisions, and both send the client a note.
Their rules are deliberately opposite, and each panel says which it is:

- **Continue plan** only ever adds. It reads the last fortnight, keeps the most
  recent workout for each weekday, and clones that shape forward up to four
  weeks. Days that already have a workout are left alone. Food needs no writes
  — an assigned target carries itself forward.
- **Adjust plan** records the decision and the note. It used to pick a
  pre-built template and overwrite the weeks ahead with it, which could not
  swap one meal, move one day, or do any of the things a review actually
  decides — the editing happens in the editors now, and this is where Dean says
  what he told them.

Either way Dean picks when to look again, the decision is stored against the
client, and the note lands on their dashboard as **Your check-in from Dean**.

The check-in is a commentable entry like any other, so the client can answer it
where it sits rather than hunting for a food log to hang the question on. Their
reply appears under the note on Dean's card, and the last check-in — plus a
collapsed list of earlier ones and their replies — is shown while he writes the
next, so this week's advice does not contradict last week's.

Weight is reported as this window's average against the previous window's, not
as an endpoint delta: a single reading moves a kilo or two on water alone, and
a board that flags noise stops being read.

Today's workout is never counted as missed — the day is not over. A check-in
records the weeks it actually wrote, so continuing a client who has no pattern
yet does not claim four weeks are covered; that case disables **Continue** and
points at **Adjust** instead.

## Planning ahead

The daily job is not writing a plan per day. It is: build the plan once on
**Plans**, then on a client's Workouts or Food tab use **Plan ahead** — pick the
plan, pick a date range, tick the weekdays it lands on. Ticking Mon/Wed/Fri
over four weeks fills twelve days in one action. Ranges are capped at 30 days.

Days that already have something assigned are skipped unless "replace" is
ticked, so a bulk assignment never wipes a day a client has already worked
through. **Planned ahead** on each tab lists what is queued.

Food is assigned per date, and a date with no plan of its own inherits the most
recent earlier one — so a target set once carries forward until it is changed.

Everything Dean sets stays editable after the fact — adjust one day's workout
without touching the rest of the week, change a calorie target, reschedule a
session.

## How privacy is enforced

Row level security, not UI checks. Every table's policy is "a client reaches
only their own rows; Dean reaches everything". Clients may write their own
logs, ticks and notes, but never the coaching content Dean sets. See the
policies at the bottom of the migration.

## Structure

- `src/lib/members/types.ts` — domain models, no React or DOM
- `src/lib/members/service.ts` — every read; Supabase or demo
- `src/lib/members/actions.ts` — every write, as server actions
- `src/lib/members/demo.ts` — the fixture used before connection
- `src/components/members/*` — the UI

`memberTabs` in `MemberTabBar.tsx` is the app's navigation too — a React
Navigation tab navigator can be built from that array directly. Its order is
deliberate: home, then the three tabs the day asks something of (workout, food,
weight), then sessions. The bar above each tab goes amber while that job is
outstanding and green once it is in, so the three sit together and fill up left
to right; sessions is the one tab that never turns green, which is why it sits
at the end rather than leaving a gap in the middle of the run. When all three
are green the home tab pulses green and the home screen offers **Submit my day**.

## Demo logins

While Supabase is unconnected the site's menu carries a **Demo logins** section
(and `/login` shows the same buttons): enter as the client demo or the coach
demo, switch between them, or sign out. No cookie means signed out, so `/app`
and `/admin` bounce to `/login` exactly as they will with real auth. The whole
section disappears once the environment variables are set.

## Not built yet

- Payments. Nothing checks that a member is actually paying £120/month.
- Client invites from inside the admin UI (invite via the Supabase dashboard
  for now).
- Realtime push. Client actions appear on Dean's next page load, not by
  live subscription.
- An inbox for Dean. A client's replies on a food log, weight entry or
  workout only show on that client's own tab — nothing counts them anywhere.
  Replies to a check-in do surface, on the check-in board.
- A password reset. The login form tells people to ask Dean, and there is no
  route that does it.
- An error boundary. Only `not-found.tsx` exists, so a server throw shows the
  raw Next.js screen.

## Who plans the food

Each client carries a `foodMode`, set by Dean on their Food tab.

- **coach** (default) — Dean assigns the meals; the client sees the finished
  plan and follows it. `/app/food/plan` redirects away.
- **self** — the client builds their own days from the meal library, to the
  targets Dean sets. Reads through `getPlanDay`, writes through
  `saveMyFoodDay`, which only ever writes food, only for the signed-in client,
  only on a date that has not happened, and only in self mode.

Dean sees and edits either mode's days on the Food tab's date picker, which
writes a one-off revision through `savePlanDay`. Switching mode never touches
the plan — it only changes who may edit.

Portions are shown to the client as **Portion: ½ / 1 / 1½ / 2** and never
explained. Nothing on any client screen mentions a multiplier, a base amount,
or a portion having been adjusted: the scaled amounts are simply the meal. A
sweep of every client page checks for this — see `pickRevision` in
`service.ts` for the other half of the rule.

## Building a week

The Plan tab is where a client's week is built and read. Seven day cards, each
showing the session title and its first exercises, the calorie target and meal
count, any booked 1:1, and what moved since the same day last week. Tapping one
opens the editor underneath it, so the week stays on screen while it is edited.

Everything is structured. Exercises come from the library and sets are number
fields; meals come from the library with a portion. Nothing parses free text
into sets, reps or calories anywhere in the product — the Templates page that
did is gone.

Four things make a week quick to build:

- **Start from another client** — pick a client, pick one of their days,
  preview it, take the training or the whole day. A copy, landing on that date
  only, which Dean then adjusts.
- **Use this for other weekdays too** — one save writes the same day onto as
  many weekdays as he ticks, which is most of setting a client up.
- **Copy to / Move to** — a day onto another date in two taps, from the card's
  own menu.
- **Repeat onto next week** — for a week that has been changed away from the
  repeating block: a deload, a holiday, a fortnight built by hand.

**+2.5kg** reaches this weekday from here on, this week only, or every day from
here on. **Scale the day to 1,950** moves every portion together until the
day's total lands on the target.
