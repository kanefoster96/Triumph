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

4. Dean creates an account at `/signup` with an email on the coach allowlist
   in the migration. The trigger reads that list and makes him an admin,
   active immediately, straight onto `/admin` — there is no acceptance step
   and no application. Adding another coach is one insert into
   `public.coach_emails`.

## Three kinds of account

Anybody can make one and get straight in. Nothing waits on approval.

- **basic** — `/signup`, email and password, active immediately. Not one of
  Dean's clients and not in his inbox. Name and photo come afterwards, on
  `/app/profile`, both optional.
- **applicant** — applied at `/join`. That writes an application and moves the
  profile to `applicant`, which is what puts them in `/admin/requests`. A basic
  account can apply later without making a second account; the wizard skips the
  email and password step when somebody is already signed in.
- **active / paused** — a client Dean has enrolled. Only these two appear in
  his client list and on his board, which is what keeps a new coach's dashboard
  empty rather than filling it with everyone who ever made an account.

Plus his own **admin** account, decided by the allowlist and nothing else —
role governs what every RLS policy will show you, so it must never be
something a signup can ask for.

## Avatars

A real upload, not a pasted URL. `AvatarUpload` puts the file straight into the
`avatars` bucket from the browser, under a folder named after whoever owns it —
the storage policy checks that prefix, so nobody can overwrite somebody else's
face — and hands the public URL to the surrounding form in a hidden input. That
is why it never has to know which form it is in. Initials stay the fallback:
most people upload nothing, and the empty state has to look deliberate.

The `/join` wizard has no photo field on purpose: an upload needs an account to
own the file, and the account does not exist until the last step.

The banner disappears and every read and write switches to Postgres. No code
changes — `src/lib/supabase/config.ts` detects the variables.

The migration has been applied to a clean Postgres 16 and checked: every table
the code reads has RLS on and a policy; every column the code names exists;
each enum matches its TypeScript union; a client can see only their own rows
and Dean's profile, and nobody else's.

`signIn` and `submitApplication` talk to real Supabase auth. Where somebody
lands is read off their profile, never assumed — a coach goes to `/admin`, a
client to `/app` — and a wrong password and an unknown address get the same
message, because saying which is which tells a stranger whose email is here.

`lib/services/payments.ts` is still a stub.

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
| **Requests** `/admin/requests` | People who applied through the website, with everything they sent. Enrolling one makes them a client and opens their week. Taking payment is a separate, clearly-stubbed step. |
| **Clients** `/admin` | A grid of everyone's week: one row per client, one column per day, three marks a day for training, food and weight, sorted by who needs looking at first. Pending day-swap requests sit above it. A card view with today's numbers is behind a toggle. |
| **Client** `/admin/clients/[id]` | Overview, Plan, Sessions, What they did, Weight. **Plan** is a list of days, each collapsed to one line, with the open day's editor in place — training and food, one save. Sessions books 1-to-1s, or shows an online client's training days. **What they did** is read only. Weight shows the trend. |
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

A **workout** is the client training alone, so it is built on that client's
**Plan** — open the day and fill it in. A suggested time is optional: give one and the client sees "Suggested 07:00";
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

## How a plan works

A plan is a pile of days. Each one either **stands for its weekday** from a
date onwards, or belongs to **one date alone** — and the pinned kind always
wins. That is the whole model. There is no block to start, no cycle length to
choose and no start date to keep in step with the calendar.

So saving a day asks one question: **just this day**, or **all future
Mondays**. Applying forward skips any future Monday already pinned to its own
date, which is what makes a deload week or a holiday safe to leave sitting in
the middle of a plan.

A date nothing has been written for is a rest day. Nothing runs out, so nothing
needs topping up, and the check-in board no longer counts weeks ahead.

Food targets carry the same way: a day with a target set stands for that
weekday until it is changed.

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

Each client carries a `foodMode`, set by Dean on their Overview.

- **coach** (default) — Dean assigns the meals; the client sees the finished
  plan and follows it. `/app/food/plan` redirects away.
- **self** — the client builds their own days from the meal library, to the
  targets Dean sets. Reads through `getPlanDay`, writes through
  `saveMyFoodDay`, which only ever writes food, only for the signed-in client,
  only on a date that has not happened, and only in self mode.

Dean sees and edits either mode's days on the Plan, which writes through
`savePlanDay`. Switching mode never touches the plan — it only changes who may
edit.

Portions are shown to the client as **Portion: ½ / 1 / 1½ / 2** and never
explained. Nothing on any client screen mentions a multiplier, a base amount,
or a portion having been adjusted: the scaled amounts are simply the meal. A
sweep of every client page checks for this — see `pickRevision` in
`service.ts` for the other half of the rule.

## Getting in

`/join` is the public signup: three screens, one question each. Name and photo,
then what they weigh and what they are after, then a summary, the confirmation
that this is online coaching, and the account. Submitting creates the account
and an application, and lands them on a thank-you that says Dean will come back
to them.

Nothing is chosen and nothing is charged. There is no plan to pick because Dean
builds one per person, and payment is a separate step he takes after enrolling
— stubbed today behind a button that says so.

Somebody who has applied has a real account with `status = 'applicant'`. They
can sign in and see their own dashboard, which tells them they are waiting.
They are in no client list and no compliance grid until Dean enrols them.

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

- **Copy last Monday** — the fast path, and the one that leads. This Monday is
  usually last Monday with a bit more weight on it.
- **From another client** — pick a client, pick one of their days, preview it,
  take the training or the whole day. A copy, landing on that date only.
- **Start blank** — a clean sheet for that half of the day.

**+2.5kg on every set** nudges the open day; the save then decides how far the
heavier version reaches. **Scale the day to 1,950** moves every portion
together until the day's total lands at or under the target.
