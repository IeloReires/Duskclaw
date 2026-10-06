-- Présence des amis sur l’accueil Duskclaw.
-- À exécuter dans Supabase > SQL Editor après amis-securite.sql.

alter table public.user_profiles
  add column if not exists last_seen_at timestamptz;

-- Le navigateur ne peut actualiser que sa propre présence.
create or replace function public.update_my_presence()
returns void
language sql
security definer
set search_path = pg_catalog, public, auth
as $$
  insert into public.user_profiles (user_id, last_seen_at)
  values (auth.uid(), now())
  on conflict (user_id) do update
    set last_seen_at = excluded.last_seen_at;
$$;
revoke all on function public.update_my_presence() from public, anon;
grant execute on function public.update_my_presence() to authenticated;

-- L’accueil ne reçoit que les 8 amis acceptés les plus pertinents.
create or replace function public.home_friends_presence()
returns table (
  nickname text,
  last_seen_at timestamptz,
  is_online boolean
)
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select coalesce(nullif(trim(p.nickname), ''), 'Joueur Duskclaw'),
         p.last_seen_at,
         coalesce(p.last_seen_at >= now() - interval '2 minutes', false)
  from public.friendships f
  join public.user_profiles p
    on p.user_id = case when f.user_low = auth.uid() then f.user_high else f.user_low end
  where auth.uid() is not null
    and f.status = 'accepted'
    and (f.user_low = auth.uid() or f.user_high = auth.uid())
  order by coalesce(p.last_seen_at >= now() - interval '2 minutes', false) desc,
           p.last_seen_at desc nulls last,
           lower(coalesce(p.nickname, ''))
  limit 8;
$$;
revoke all on function public.home_friends_presence() from public, anon;
grant execute on function public.home_friends_presence() to authenticated;
