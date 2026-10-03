-- Table des collections privées Duskclaw.
-- Chaque ligne appartient à un seul compte Auth; les politiques RLS s'appliquent
-- même si quelqu'un modifie les requêtes du navigateur.
create table if not exists public.user_collection (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  card_number smallint not null check (card_number between 1 and 75),
  quantity smallint not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  primary key (user_id, card_number)
);

alter table public.user_collection enable row level security;
revoke all on table public.user_collection from anon, authenticated;
grant select, insert, update, delete on table public.user_collection to authenticated;

drop policy if exists "Users can read their own collection" on public.user_collection;
create policy "Users can read their own collection"
  on public.user_collection for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add to their own collection" on public.user_collection;
create policy "Users can add to their own collection"
  on public.user_collection for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own collection" on public.user_collection;
create policy "Users can update their own collection"
  on public.user_collection for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove from their own collection" on public.user_collection;
create policy "Users can remove from their own collection"
  on public.user_collection for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Liste de souhaits privée de chaque compte Duskclaw.
create table if not exists public.user_wishlist (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  card_number smallint not null check (card_number between 1 and 75),
  created_at timestamptz not null default now(),
  primary key (user_id, card_number)
);

alter table public.user_wishlist enable row level security;
revoke all on table public.user_wishlist from anon, authenticated;
grant select, insert, delete on table public.user_wishlist to authenticated;

drop policy if exists "Users can read their own wishlist" on public.user_wishlist;
create policy "Users can read their own wishlist"
  on public.user_wishlist for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add to their own wishlist" on public.user_wishlist;
create policy "Users can add to their own wishlist"
  on public.user_wishlist for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove from their own wishlist" on public.user_wishlist;
create policy "Users can remove from their own wishlist"
  on public.user_wishlist for delete to authenticated
  using ((select auth.uid()) = user_id);
