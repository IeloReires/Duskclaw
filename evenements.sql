-- Rencontres et événements Duskclaw.
-- Nécessite public.is_site_moderator() (migration moderation-securite.sql).

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  city text not null check (char_length(trim(city)) between 2 and 80),
  venue text not null default '' check (char_length(venue) <= 160),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  signup_url text not null default '' check (char_length(signup_url) <= 500),
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_events_valid_period check (starts_at < ends_at)
);

create index if not exists community_events_public_start_idx
  on public.community_events (starts_at) where status = 'published';

alter table public.community_events enable row level security;
revoke all on public.community_events from public, anon, authenticated;
grant select on public.community_events to anon, authenticated;
grant insert, update, delete on public.community_events to authenticated;

drop policy if exists "Published events are public" on public.community_events;
create policy "Published events are public" on public.community_events
  for select to anon, authenticated using (status = 'published');

drop policy if exists "Moderators manage events" on public.community_events;
create policy "Moderators manage events" on public.community_events
  for all to authenticated
  using ((select public.is_site_moderator()))
  with check ((select public.is_site_moderator()));

create table if not exists public.event_registrations (
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_registrations_user_idx
  on public.event_registrations (user_id, created_at desc);

alter table public.event_registrations enable row level security;
revoke all on public.event_registrations from public, anon, authenticated;
grant select, insert, delete on public.event_registrations to authenticated;

drop policy if exists "Players read their own event registrations" on public.event_registrations;
create policy "Players read their own event registrations" on public.event_registrations
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_site_moderator()));

drop policy if exists "Players register for public events" on public.event_registrations;
create policy "Players register for public events" on public.event_registrations
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.community_events e
      where e.id = event_id and e.status = 'published' and e.starts_at > now()
    )
  );

drop policy if exists "Players cancel their own event registration" on public.event_registrations;
create policy "Players cancel their own event registration" on public.event_registrations
  for delete to authenticated using ((select auth.uid()) = user_id);
