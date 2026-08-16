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
| **Sessions** `/app/sessions` | Upcoming and past, with Dean's notes on past ones. |
| **Workouts** `/app/workouts` | Today's workout as a checklist. Ticks apply optimistically; the client adds a note. Past workouts keep their completion state and notes. |
| **Food** `/app/food` | Dean's assigned meals and/or calorie target. Log incrementally or as one end-of-day total, with a running total against target. |
| **Weight** `/app/weight` | Daily entry plus a trend line and history. |

## Trainer

| Screen | What it does |
| --- | --- |
| **Clients** `/admin` | Every client with last activity, on/off track, and today's workout, calories and weight at a glance. |
| **Client** `/admin/clients/[id]` | Everything for one client, and the place Dean edits it: assign or rewrite a workout, set calorie/protein targets and meals, schedule sessions, add session notes, reply to any client note. |
| **Schedule** `/admin/schedule` | Every session across all clients, grouped by day. Anything added shows up in that client's Sessions tab. |

Everything Dean sets stays editable after the fact — adjust a workout mid-week,
change a calorie target, reschedule a session.

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
- The trainer planning tools — libraries, templates, range assignment,
  progression memory, shopping list. Spec in ROADMAP.md.
