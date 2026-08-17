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
| **Sessions** `/app/sessions` | A month calendar marking sessions with Dean and workouts to complete, the picked day's detail, then upcoming and past with Dean's notes. |
| **Workouts** `/app/workouts` | Today's workout as a checklist. Ticks apply optimistically; the client adds a note. Past workouts keep their completion state and notes. |
| **Food** `/app/food` | Dean's assigned meals and/or calorie target. Log incrementally or as one end-of-day total, with a running total against target. |
| **Weight** `/app/weight` | Daily entry plus a trend line and history. |

## Trainer

| Screen | What it does |
| --- | --- |
| **Clients** `/admin` | Every client with last activity, on/off track, and today's workout, calories and weight at a glance. |
| **Client** `/admin/clients/[id]` | The same five tabs the client sees, but editable. Overview mirrors their dashboard and surfaces recent notes; Sessions schedules, edits and cancels; Workouts assigns the checklist and shows what they ticked; Food sets targets and meals; Weight shows the trend and allows corrections. Dean can reply to any note from its tab. |
| **Plans** `/admin/plans` | Reusable workout plans and food plans, built once and assigned to as many days as needed. Independent of any client. |
| **Schedule** `/admin/schedule` | A month calendar of every session across all clients. Pick a day to see it and add to it — client, time, location picker with a free-text override. Anything added shows up in that client's Sessions tab. |

## Calendars

Two things get put on a date, and they are deliberately different.

A **session** is time with Dean, so it is booked from Dean's own **Schedule**:
pick the day, then the client, the time and where it is. It lands on the
client's calendar as an accent dot.

A **workout** is the client training alone, so it is assigned from that client's
**Workouts** tab, which shows their calendar. Dean adds a one-off to the picked
day, or uses **Plan ahead** to repeat a plan weekly on chosen weekdays. A
suggested time is optional: give one and the client sees "Suggested 07:00";
leave it blank and it is simply a workout to complete that day, whenever suits
them. Workouts carry a muted dot.

Every calendar is built from links, no client JavaScript. The picked day lives
in the URL (`?month=&date=`), so it survives a refresh and is shareable. The
selected day is filled, today is outlined.

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
Navigation tab navigator can be built from that array directly.

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
- The rest of the planning tools — meal and exercise libraries, calorie
  auto-fill, progression memory and shopping lists. Spec in ROADMAP.md.
  Templates and range assignment are done.
