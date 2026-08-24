-- ---------------------------------------------------------------------------
-- Talking to each other
--
-- Everything in 0001 is Dean writing a plan and a client working through it:
-- one voice, one direction. These four tables are the other direction and the
-- sideways one — a message, a request, an announcement, and a board the whole
-- gym can see.
--
-- The rule from 0001 still holds and is the only thing enforcing privacy: a
-- client reaches their own rows, Dean reaches everything, and the policy is
-- what says so rather than any check in the app.
-- ---------------------------------------------------------------------------

-- Who the board is for.
--
-- A SECURITY DEFINER function rather than a join written out in every policy,
-- because the page that renders the board has to ask the same question the
-- policies ask. One definition, used in both, so a client can never be shown a
-- door that the database will not open.
create or replace function public.has_community_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or status in ('active', 'paused'))
  );
$$;

-- ---------------------------------------------------------------------------
-- Chat
--
-- One thread per client, forever. Dean coaches a few dozen people rather than
-- a queue of strangers, so there is nothing to assign and nothing to route:
-- the pair of them have one conversation and it is the same one in a year.
--
-- `closed_at` is Dean saying "that's dealt with", which is what sorts his
-- inbox. Any new message clears it, because a thread somebody just wrote in is
-- not dealt with.
-- ---------------------------------------------------------------------------

create table public.chat_threads (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null unique references public.profiles(id) on delete cascade,
  -- Denormalised so the inbox sorts without touching the messages table.
  last_message_at timestamptz,
  -- Read marks, one per side. A timestamp rather than a per-message row: the
  -- only question either side asks is "anything since I last looked".
  client_read_at  timestamptz,
  coach_read_at   timestamptz,
  closed_at       timestamptz,
  closed_by       uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index chat_threads_inbox_idx on public.chat_threads (last_message_at desc nulls last);

create table public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.chat_threads(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  -- Snapshotted rather than joined: the side a message came from decides which
  -- way round it is drawn, and that must not change if a role ever does.
  from_coach      boolean not null default false,
  body            text,
  -- A path in the private bucket, never a URL. Anything the client sees is a
  -- signed URL minted at read time and good for an hour.
  attachment_path text,
  attachment_type text,
  attachment_name text,
  created_at      timestamptz not null default now(),
  -- A message with neither words nor a file is a mis-send, not a message.
  constraint chat_messages_not_empty
    check (coalesce(body, '') <> '' or attachment_path is not null)
);

create index chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

-- ---------------------------------------------------------------------------
-- Change requests
--
-- A client asking Dean to change something about how they are coached. The
-- same shape as a day swap and for the same reason: their goal and their mode
-- are coaching decisions, so a client may ask for one and only Dean's approval
-- moves anything.
--
-- The requested value is text whatever the field is, because this table is a
-- record of an ask rather than a staging copy of a profile. Applying it is the
-- server action's job, and it validates the value then.
-- ---------------------------------------------------------------------------

create type public.change_field as enum (
  'full_name', 'goal', 'goal_weight', 'coaching_mode', 'food_mode'
);
create type public.change_status as enum ('pending', 'approved', 'declined');

create table public.change_requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  field           public.change_field not null,
  -- What it was when they asked, so the request still reads months later.
  current_value   text,
  requested_value text not null,
  reason          text,
  status          public.change_status not null default 'pending',
  created_at      timestamptz not null default now(),
  decided_at      timestamptz,
  decided_by      uuid references public.profiles(id) on delete set null
);

create index change_requests_open_idx on public.change_requests (status, created_at desc);
create index change_requests_client_idx on public.change_requests (client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Notifications
--
-- One table for both kinds. `recipient_id` null is everybody — a gym-wide
-- announcement is one row, not one row per person — and a set id is for one
-- client, which is what an approved request or a mention sends.
--
-- There is no read table. Who has read what is a single timestamp on the
-- user's own auth metadata: the only question the bell asks is "anything since
-- I last looked", and a row per person per notification to answer it would be
-- the largest table in the database inside a year.
--
-- Only Dean writes here. A client telling Dean something is a message or a
-- request, both of which have their own table and their own badge, so nothing
-- needs to insert on somebody else's behalf.
-- ---------------------------------------------------------------------------

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  -- Null is everyone.
  recipient_id uuid references public.profiles(id) on delete cascade,
  sent_by      uuid references public.profiles(id) on delete set null,
  -- Snapshotted so an old announcement still carries a name.
  sent_by_name text not null default '',
  title        text not null,
  body         text,
  -- Where it takes you when tapped. An in-app path, never an absolute URL.
  action_href  text,
  created_at   timestamptz not null default now()
);

create index notifications_feed_idx on public.notifications (created_at desc);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- The board
--
-- The one place in the product where clients see each other. Author name and
-- photo are snapshotted onto the row so a wall of posts renders without a join
-- per post, and so a post still reads after somebody leaves.
--
-- `tagged` is who Dean meant it for — 'everyone', 'online', 'one_to_one' —
-- parsed from what he typed and used to fan out notifications. It does not
-- restrict who can see the post: everybody on the board sees everything, or it
-- stops being a board.
-- ---------------------------------------------------------------------------

create table public.posts (
  id                uuid primary key default gen_random_uuid(),
  author_id         uuid not null references public.profiles(id) on delete cascade,
  author_name       text not null default '',
  author_avatar_url text,
  -- True for Dean's own posts, snapshotted for the same reason as a message.
  from_coach        boolean not null default false,
  body              text not null,
  -- Paths in the private bucket. Signed in one batch when the page renders.
  media_paths       text[] not null default '{}',
  tagged            text[] not null default '{}',
  created_at        timestamptz not null default now()
);

create index posts_feed_idx on public.posts (created_at desc);

create table public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.posts(id) on delete cascade,
  author_id         uuid not null references public.profiles(id) on delete cascade,
  author_name       text not null default '',
  author_avatar_url text,
  from_coach        boolean not null default false,
  body              text not null,
  created_at        timestamptz not null default now()
);

create index post_comments_post_idx on public.post_comments (post_id, created_at);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.chat_threads    enable row level security;
alter table public.chat_messages   enable row level security;
alter table public.change_requests enable row level security;
alter table public.notifications   enable row level security;
alter table public.posts           enable row level security;
alter table public.post_likes      enable row level security;
alter table public.post_comments   enable row level security;

-- Chat: the client owns one thread and may open it; Dean reaches every thread.
-- Marking read is an update, and both sides do it, so the update policy is the
-- same on both — the columns they each touch are different but the row is one.
create policy "read own thread" on public.chat_threads
  for select using (client_id = auth.uid() or public.is_admin());
create policy "open own thread" on public.chat_threads
  for insert with check (client_id = auth.uid() or public.is_admin());
create policy "touch own thread" on public.chat_threads
  for update using (client_id = auth.uid() or public.is_admin())
  with check (client_id = auth.uid() or public.is_admin());
create policy "admin closes threads" on public.chat_threads
  for delete using (public.is_admin());

-- A message is reachable through its thread, and you may only send as
-- yourself: without the sender_id check a client could post a message into
-- their own thread wearing Dean's name.
create policy "read own messages" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_threads t
      where t.id = thread_id and (t.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "send as yourself" on public.chat_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_threads t
      where t.id = thread_id and (t.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "admin deletes messages" on public.chat_messages
  for delete using (public.is_admin());

-- Change requests: raise your own, read your own, withdraw one while it is
-- still pending. Deciding is Dean's alone.
create policy "read own change requests" on public.change_requests
  for select using (client_id = auth.uid() or public.is_admin());
create policy "raise own change request" on public.change_requests
  for insert with check (client_id = auth.uid() and status = 'pending');
create policy "withdraw pending change request" on public.change_requests
  for delete using (client_id = auth.uid() and status = 'pending');
create policy "admin decides change requests" on public.change_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- Notifications: a broadcast is for everyone signed in, a targeted one is for
-- its recipient. This select policy is the whole of the filtering — the app
-- asks for every row and the database hands back the ones you may see.
create policy "read notifications for me" on public.notifications
  for select using (
    auth.uid() is not null
    and (recipient_id is null or recipient_id = auth.uid() or public.is_admin())
  );
create policy "admin sends notifications" on public.notifications
  for insert with check (public.is_admin());
create policy "admin deletes notifications" on public.notifications
  for delete using (public.is_admin());

-- The board: one door, and `has_community_access` is it. Somebody who has made
-- an account but is not training yet is signed in and still cannot see a word
-- of it.
create policy "read the board" on public.posts
  for select using (public.has_community_access());
create policy "post to the board" on public.posts
  for insert with check (author_id = auth.uid() and public.has_community_access());
create policy "edit own post" on public.posts
  for update using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
create policy "delete own post" on public.posts
  for delete using (author_id = auth.uid() or public.is_admin());

create policy "read likes" on public.post_likes
  for select using (public.has_community_access());
create policy "like as yourself" on public.post_likes
  for insert with check (user_id = auth.uid() and public.has_community_access());
create policy "unlike your own" on public.post_likes
  for delete using (user_id = auth.uid());

create policy "read comments on the board" on public.post_comments
  for select using (public.has_community_access());
create policy "comment as yourself" on public.post_comments
  for insert with check (author_id = auth.uid() and public.has_community_access());
create policy "delete own board comment" on public.post_comments
  for delete using (author_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Files
--
-- Both buckets are private. Nothing in either is a marketing image: one holds
-- a photo somebody sent their coach, the other holds the gym's own wall. They
-- are served as signed URLs good for an hour, minted per request.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments', 'chat-attachments', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'board', 'board', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- An attachment lives under its thread, so who may reach it is the same
-- question as who may read the thread — asked of the first path segment.
create policy "read own chat files" on storage.objects
  for select using (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.chat_threads t
      where t.id::text = (storage.foldername(name))[1]
        and (t.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "upload to own chat" on storage.objects
  for insert with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.chat_threads t
      where t.id::text = (storage.foldername(name))[1]
        and (t.client_id = auth.uid() or public.is_admin())
    )
  );
create policy "admin deletes chat files" on storage.objects
  for delete using (bucket_id = 'chat-attachments' and public.is_admin());

-- Board media is filed under whoever uploaded it, so a client can only ever
-- write into their own folder — and anybody on the board can read it.
create policy "read board files" on storage.objects
  for select using (bucket_id = 'board' and public.has_community_access());
create policy "upload own board files" on storage.objects
  for insert with check (
    bucket_id = 'board'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.has_community_access()
  );
create policy "delete own board files" on storage.objects
  for delete using (
    bucket_id = 'board'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Realtime
--
-- These are the tables where a change has to reach a screen somebody is
-- already looking at. Realtime applies the same select policies above, so a
-- client is only ever told about a row they could have read anyway.
--
-- Every screen also polls every five seconds. The socket is the fast path, not
-- the only one: a phone that has been in a pocket comes back with a dropped
-- connection and no way to know it missed anything.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_threads;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.change_requests;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.post_comments;
