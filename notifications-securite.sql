-- Duskclaw : notifications privées du compte.
-- À exécuter une fois dans Supabase > SQL Editor.

create table if not exists public.user_notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('friend_request','friend_accepted','badge_awarded','trade_offer')),
  title text not null,
  message text not null,
  href text not null default 'amis.html',
  event_key text not null unique,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists user_notifications_unread_idx
  on public.user_notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.user_notifications enable row level security;
revoke all on public.user_notifications from anon, public;
grant select on public.user_notifications to authenticated;
grant update (read_at) on public.user_notifications to authenticated;

drop policy if exists "Users can view their notifications" on public.user_notifications;
create policy "Users can view their notifications"
  on public.user_notifications for select to authenticated
  using (recipient_id = (select auth.uid()));

drop policy if exists "Users can mark their notifications read" on public.user_notifications;
create policy "Users can mark their notifications read"
  on public.user_notifications for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create or replace function public.create_friend_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  actor uuid;
  recipient uuid;
  actor_name text;
  created_key text;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    actor := new.requested_by;
    recipient := case when new.user_low = actor then new.user_high else new.user_low end;
    select coalesce(nullif(trim(p.nickname), ''), 'Un joueur') into actor_name
      from public.user_profiles p where p.user_id = actor;
    actor_name := coalesce(actor_name, 'Un joueur');
    created_key := to_char(new.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US');
    insert into public.user_notifications(recipient_id, actor_id, kind, title, message, href, event_key, created_at)
    values (recipient, actor, 'friend_request', 'Nouvelle demande d’ami', actor_name || ' souhaite rejoindre ta liste d’amis.',
      'amis.html#requests-list', 'friend_request:' || new.user_low::text || ':' || new.user_high::text || ':' || created_key, new.created_at)
    on conflict (event_key) do nothing;
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    recipient := new.requested_by;
    actor := case when new.user_low = new.requested_by then new.user_high else new.user_low end;
    select coalesce(nullif(trim(p.nickname), ''), 'Un joueur') into actor_name
      from public.user_profiles p where p.user_id = actor;
    actor_name := coalesce(actor_name, 'Un joueur');
    created_key := to_char(new.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US');
    insert into public.user_notifications(recipient_id, actor_id, kind, title, message, href, event_key)
    values (recipient, actor, 'friend_accepted', 'Demande acceptée', actor_name || ' a accepté ta demande d’amitié.',
      'amis.html', 'friend_accepted:' || new.user_low::text || ':' || new.user_high::text || ':' || created_key)
    on conflict (event_key) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.create_friend_notification() from public, anon, authenticated;
drop trigger if exists notify_friendship_insert on public.friendships;
create trigger notify_friendship_insert
after insert on public.friendships
for each row execute function public.create_friend_notification();
drop trigger if exists notify_friendship_accept on public.friendships;
create trigger notify_friendship_accept
after update of status on public.friendships
for each row execute function public.create_friend_notification();

create or replace function public.create_badge_notification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  badge_label text;
  created_key text;
begin
  badge_label := initcap(replace(new.badge_key, '_', ' '));
  created_key := to_char(new.granted_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US');
  insert into public.user_notifications(recipient_id, actor_id, kind, title, message, href, event_key, created_at)
  values (new.user_id, new.granted_by, 'badge_awarded', 'Nouveau badge obtenu', 'Le badge « ' || badge_label || ' » a été ajouté à ton profil.',
    'mon-compte.html', 'badge_awarded:' || new.user_id::text || ':' || new.badge_key || ':' || created_key, new.granted_at)
  on conflict (event_key) do nothing;
  return new;
end;
$$;

revoke all on function public.create_badge_notification() from public, anon, authenticated;
drop trigger if exists notify_badge_award on public.user_badges;
create trigger notify_badge_award
after insert on public.user_badges
for each row execute function public.create_badge_notification();

-- Les demandes déjà en attente au moment de l’installation apparaissent aussi dans la cloche.
insert into public.user_notifications(recipient_id, actor_id, kind, title, message, href, event_key, created_at)
select case when f.user_low = f.requested_by then f.user_high else f.user_low end,
       f.requested_by,
       'friend_request',
       'Nouvelle demande d’ami',
       coalesce(nullif(trim(p.nickname), ''), 'Un joueur') || ' souhaite rejoindre ta liste d’amis.',
       'amis.html#requests-list',
       'friend_request:' || f.user_low::text || ':' || f.user_high::text || ':' || to_char(f.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
       f.created_at
from public.friendships f
left join public.user_profiles p on p.user_id = f.requested_by
where f.status = 'pending'
on conflict (event_key) do nothing;

-- Active les mises à jour instantanées du panneau si la publication Realtime standard existe.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_notifications'
     ) then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end
$$;
