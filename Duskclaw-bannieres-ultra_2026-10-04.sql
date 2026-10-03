-- Ajoute les réglages avancés de bannière au profil et les expose dans
-- l'aperçu public des profils, sans ouvrir l'accès aux photos personnelles.
begin;

alter table public.user_profiles
  add column if not exists banner_settings jsonb not null default '{}'::jsonb;

drop function if exists public.public_friend_profile_preview(uuid);

create function public.public_friend_profile_preview(target_user_id uuid)
returns table (
  user_id uuid,
  nickname text,
  avatar_path text,
  banner_theme text,
  banner_color text,
  banner_settings jsonb,
  featured_cards integer[],
  badges text[]
)
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select p.user_id,
         p.nickname,
         p.avatar_path,
         p.banner_theme,
         p.banner_color,
         p.banner_settings,
         p.featured_cards,
         public.friends_profile_badges(p.user_id)
  from public.user_profiles p
  where auth.uid() is not null
    and p.user_id = target_user_id;
$$;

revoke all on function public.public_friend_profile_preview(uuid) from public, anon;
grant execute on function public.public_friend_profile_preview(uuid) to authenticated;

commit;
