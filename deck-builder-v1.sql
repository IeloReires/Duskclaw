-- Deck Builder Duskclaw : listes de decks personnelles et liens de lecture.
-- Exécuter une fois dans Supabase > SQL Editor.

create table if not exists public.user_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null default 'Nouveau deck' check (char_length(trim(name)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 500),
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  entries jsonb not null default '[]'::jsonb check (jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_decks_owner_updated_idx
  on public.user_decks (user_id, updated_at desc);

alter table public.user_decks enable row level security;
revoke all on public.user_decks from public, anon, authenticated;
grant select on public.user_decks to anon, authenticated;
grant insert, update, delete on public.user_decks to authenticated;

drop policy if exists "Owners manage their decks" on public.user_decks;
create policy "Owners manage their decks" on public.user_decks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Public decks are readable" on public.user_decks;
create policy "Public decks are readable" on public.user_decks
  for select to anon, authenticated
  using (visibility = 'public');

drop policy if exists "Friends can read shared decks" on public.user_decks;
create policy "Friends can read shared decks" on public.user_decks
  for select to authenticated
  using (
    visibility = 'friends'
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.user_low = (select auth.uid()) and f.user_high = user_decks.user_id)
          or (f.user_high = (select auth.uid()) and f.user_low = user_decks.user_id))
    )
  );
