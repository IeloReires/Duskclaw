-- Duskclaw: profil communautaire pour un jeu de cartes physique.
-- À exécuter une fois dans Supabase > SQL Editor après les migrations comptes/amis/collection.
begin;

alter table public.user_profiles
  add column if not exists banner_theme text not null default 'water',
  add column if not exists banner_color text not null default '#b895ff',
  add column if not exists banner_settings jsonb not null default '{}'::jsonb,
  add column if not exists featured_cards integer[] not null default '{}',
  add column if not exists bio text not null default '',
  add column if not exists community_role text not null default 'Joueur',
  add column if not exists favorite_furry_id smallint,
  add column if not exists favorite_type text not null default '',
  add column if not exists profile_visibility text not null default 'public',
  add column if not exists collection_visibility text not null default 'private',
  add column if not exists wishlist_visibility text not null default 'private',
  add column if not exists community_since date;

update public.user_profiles p
set community_since = coalesce(u.created_at::date, current_date)
from auth.users u
where u.id = p.user_id and p.community_since is null;

update public.user_profiles
set community_since = current_date
where community_since is null;

alter table public.user_profiles
  alter column community_since set default current_date,
  alter column community_since set not null;

alter table public.user_profiles drop constraint if exists user_profiles_bio_length;
alter table public.user_profiles add constraint user_profiles_bio_length
  check (char_length(bio) <= 280);
alter table public.user_profiles drop constraint if exists user_profiles_community_role_allowed;
alter table public.user_profiles add constraint user_profiles_community_role_allowed
  check (community_role in ('Joueur','Collectionneur','Créateur de decks','Artiste','Playtester','Organisateur'));
alter table public.user_profiles drop constraint if exists user_profiles_favorite_type_allowed;
alter table public.user_profiles add constraint user_profiles_favorite_type_allowed
  check (favorite_type in ('','Glace','Eau','Vent','Plante','Roche'));
alter table public.user_profiles drop constraint if exists user_profiles_profile_visibility_allowed;
alter table public.user_profiles add constraint user_profiles_profile_visibility_allowed
  check (profile_visibility in ('public','friends','private'));
alter table public.user_profiles drop constraint if exists user_profiles_collection_visibility_allowed;
alter table public.user_profiles add constraint user_profiles_collection_visibility_allowed
  check (collection_visibility in ('public','friends','private'));
alter table public.user_profiles drop constraint if exists user_profiles_wishlist_visibility_allowed;
alter table public.user_profiles add constraint user_profiles_wishlist_visibility_allowed
  check (wishlist_visibility in ('public','friends','private'));
alter table public.user_profiles drop constraint if exists user_profiles_favorite_furry_id_allowed;
alter table public.user_profiles add constraint user_profiles_favorite_furry_id_allowed
  check (favorite_furry_id is null or favorite_furry_id between 1 and 180);

drop policy if exists "Friends can view shared profiles" on public.user_profiles;
drop policy if exists "Members can view profiles allowed by visibility" on public.user_profiles;
create policy "Members can view profiles allowed by visibility" on public.user_profiles
  for select to authenticated using (
    profile_visibility = 'public'
    or (profile_visibility = 'friends' and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.user_low = (select auth.uid()) and f.user_high = user_profiles.user_id)
          or (f.user_high = (select auth.uid()) and f.user_low = user_profiles.user_id))
    ))
  );

-- Un profil complet n'est transmis qu'à son propriétaire, à ses amis si le profil
-- est réglé sur « amis », ou à tout membre connecté si le profil est public.
-- Le mode invitation ne révèle que le pseudo afin de permettre une demande d'ami.
drop function if exists public.public_friend_profile_preview(uuid);
drop function if exists public.public_friend_profile_preview(uuid, boolean);

create function public.public_friend_profile_preview(target_user_id uuid, invitation_preview boolean default false)
returns table (
  user_id uuid,
  nickname text,
  avatar_path text,
  banner_theme text,
  banner_color text,
  banner_settings jsonb,
  bio text,
  community_role text,
  favorite_furry_id smallint,
  favorite_type text,
  profile_visibility text,
  community_since date,
  featured_cards integer[],
  badges text[],
  collection_owned integer,
  collection_total integer,
  can_view_profile boolean,
  can_view_collection boolean,
  can_view_wishlist boolean,
  wishlist_cards integer[]
)
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  with target as (
    select p.*,
      (p.user_id = auth.uid()) as is_self,
      exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and ((f.user_low = auth.uid() and f.user_high = p.user_id)
            or (f.user_high = auth.uid() and f.user_low = p.user_id))
      ) as is_friend
    from public.user_profiles p
    where auth.uid() is not null and p.user_id = target_user_id
  ), permitted as (
    select t.*,
      (t.is_self or t.profile_visibility = 'public'
        or (t.profile_visibility = 'friends' and t.is_friend)) as profile_ok,
      ((t.is_self or t.profile_visibility = 'public'
          or (t.profile_visibility = 'friends' and t.is_friend))
        and (t.is_self or t.collection_visibility = 'public'
          or (t.collection_visibility = 'friends' and t.is_friend))) as collection_ok,
      ((t.is_self or t.profile_visibility = 'public'
          or (t.profile_visibility = 'friends' and t.is_friend))
        and (t.is_self or t.wishlist_visibility = 'public'
          or (t.wishlist_visibility = 'friends' and t.is_friend))) as wishlist_ok
    from target t
  )
  select p.user_id,
    p.nickname,
    case when p.profile_ok then p.avatar_path end,
    case when p.profile_ok then p.banner_theme end,
    case when p.profile_ok then p.banner_color end,
    case when p.profile_ok then p.banner_settings end,
    case when p.profile_ok then p.bio end,
    case when p.profile_ok then p.community_role end,
    case when p.profile_ok then p.favorite_furry_id end,
    case when p.profile_ok then p.favorite_type end,
    p.profile_visibility,
    case when p.profile_ok then p.community_since end,
    case when p.profile_ok then p.featured_cards else '{}'::integer[] end,
    case when p.profile_ok then public.friends_profile_badges(p.user_id) else '{}'::text[] end,
    case when p.collection_ok then (
      select count(distinct c.card_number)::integer from public.user_collection c where c.user_id = p.user_id
    ) end,
    case when p.collection_ok then (
      select count(*)::integer from public.duskclaw_card_catalog
    ) end,
    p.profile_ok,
    p.collection_ok,
    p.wishlist_ok,
    case when p.profile_ok and p.wishlist_ok then coalesce((
      select array_agg(w.card_number::integer order by w.card_number)
      from public.user_wishlist w where w.user_id = p.user_id
    ), '{}'::integer[]) else '{}'::integer[] end
  from permitted p
  where p.profile_ok or coalesce(invitation_preview, false);
$$;

revoke all on function public.public_friend_profile_preview(uuid, boolean) from public, anon;
grant execute on function public.public_friend_profile_preview(uuid, boolean) to authenticated;

-- Les helpers ne sont plus appelables directement : les données passent par la
-- fonction de profil qui applique les réglages de visibilité.
revoke all on function public.friends_profile_badges(uuid) from public, anon, authenticated;
revoke all on function public.friends_profile_wishlist(uuid) from public, anon, authenticated;

commit;
