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
| **Clients** `/admin` | Every client with last activity, on/off track, and today's workout, calories and weight at a glance. |
| **Client** `/admin/clients/[id]` | The same five tabs the client sees, but editable. Overview mirrors their dashboard and surfaces recent notes; Sessions schedules, edits and cancels; Workouts assigns the checklist and shows what they ticked; Food sets targets and meals; Weight shows the trend and allows corrections. Dean can reply to any note from its tab. |
| **Check-ins** `/admin/checkin` | The weekly round. Every active client with how their last stretch went, anything they wrote, and how far ahead they are planned — then continue the plan or adjust it, both with a note. |
| **Plans** `/admin/plans` | Reusable workout plans and food plans, built once and assigned to as many days as needed. Independent of any client. |
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

Two decisions, and both write the plan forward and send the client a note.
Their rules are deliberately opposite, and each panel says which it is:

- **Continue plan** only ever adds. It reads the last fortnight, keeps the most
  recent workout for each weekday, and clones that shape forward up to four
  weeks. Days that already have a workout are left alone. Food needs no writes
  — an assigned target carries itself forward.
- **Adjust plan** replaces. Pick a workout plan and the weeks ahead become
  exactly the weekdays ticked: anything queued on other days is cleared, so
  dropping someone from five days to three actually leaves them on three. Leave
  a picker on "as they are" and that half is untouched. Nothing before tomorrow
  is ever altered, and the panel shows how much is currently queued before Dean
  commits. This is also the one place both halves of the week are set in a
  single pass.

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

## On its way out

`/admin/plans` ("Templates") is the older way of assigning a day: free-text
session and day plans, unconnected to the exercise and meal libraries. The
repeating plan block replaces it, and the client Workouts tab has already been
moved over. Two screens still read templates and have to be moved before the
page can go:

- the check-in round's **Adjust plan** fast path, and
- a client's **Food** tab assigner.
