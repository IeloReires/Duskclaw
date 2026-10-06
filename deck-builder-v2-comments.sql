-- Commentaires sur les decks partagés.
-- Prérequis : deck-builder-v1.sql, profil-community-v1.sql et amis-securite.sql.

create table if not exists public.user_deck_comments (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.user_decks(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_label text not null default 'Membre' check (char_length(author_label) <= 40),
  content text not null check (char_length(trim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists user_deck_comments_deck_created_idx
  on public.user_deck_comments (deck_id, created_at asc);

alter table public.user_deck_comments enable row level security;
revoke all on public.user_deck_comments from public, anon, authenticated;
grant select (id, deck_id, author_label, content, created_at) on public.user_deck_comments to anon, authenticated;
grant select (author_id) on public.user_deck_comments to authenticated;
grant insert (deck_id, content) on public.user_deck_comments to authenticated;
grant update (content) on public.user_deck_comments to authenticated;
grant delete on public.user_deck_comments to authenticated;

create or replace function public.set_deck_comment_author_label()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  profile_nickname text;
  visibility_value text;
begin
  new.author_id := auth.uid();
  select up.nickname, up.profile_visibility
    into profile_nickname, visibility_value
    from public.user_profiles as up
    where up.user_id = new.author_id;
  if visibility_value = 'public' and nullif(trim(profile_nickname), '') is not null then
    new.author_label := left(trim(profile_nickname), 40);
  else
    new.author_label := 'Membre';
  end if;
  return new;
end
$$;

revoke all on function public.set_deck_comment_author_label() from public, anon, authenticated;
drop trigger if exists user_deck_comments_set_author_label on public.user_deck_comments;
create trigger user_deck_comments_set_author_label
  before insert on public.user_deck_comments
  for each row execute function public.set_deck_comment_author_label();

drop policy if exists "Comments follow deck visibility" on public.user_deck_comments;
create policy "Comments follow deck visibility" on public.user_deck_comments
  for select to anon, authenticated
  using (exists (select 1 from public.user_decks d where d.id = user_deck_comments.deck_id));

drop policy if exists "Members comment on shared decks" on public.user_deck_comments;
create policy "Members comment on shared decks" on public.user_deck_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.user_decks d
      where d.id = user_deck_comments.deck_id
        and d.user_id <> (select auth.uid())
        and d.visibility in ('public','friends')
    )
  );

drop policy if exists "Authors edit their own deck comments" on public.user_deck_comments;
create policy "Authors edit their own deck comments" on public.user_deck_comments
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists "Authors or deck owners remove comments" on public.user_deck_comments;
create policy "Authors or deck owners remove comments" on public.user_deck_comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.user_decks d
      where d.id = user_deck_comments.deck_id and d.user_id = (select auth.uid())
    )
  );
