-- Prépare les profils privés et le stockage privé des photos Duskclaw.
-- À exécuter dans Supabase > SQL Editor avant d’activer la page de compte.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  avatar_path text,
  updated_at timestamptz not null default now(),
  constraint user_profiles_nickname_length check (char_length(nickname) <= 24)
);

alter table public.user_profiles enable row level security;
grant select, insert, update on public.user_profiles to authenticated;

-- Chaque personne ne peut lire, créer et modifier que sa propre ligne de profil.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can read own profile') then
    execute $policy$create policy "Users can read own profile" on public.user_profiles for select to authenticated using ((select auth.uid()) = user_id)$policy$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can create own profile') then
    execute $policy$create policy "Users can create own profile" on public.user_profiles for insert to authenticated with check ((select auth.uid()) = user_id)$policy$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can update own profile') then
    execute $policy$create policy "Users can update own profile" on public.user_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)$policy$;
  end if;
end
$$;

-- Bucket privé pour les avatars (10 Mo maximum, formats image uniquement).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-avatars', 'user-avatars', false, 10485760, array['image/jpeg','image/png','image/webp']::text[])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Les règles Storage limitent chaque personne à son propre dossier user_id/.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can read own avatar files') then
    execute $policy$create policy "Users can read own avatar files" on storage.objects for select to authenticated using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))$policy$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can upload own avatar files') then
    execute $policy$create policy "Users can upload own avatar files" on storage.objects for insert to authenticated with check (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))$policy$;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own avatar files') then
    execute $policy$create policy "Users can delete own avatar files" on storage.objects for delete to authenticated using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))$policy$;
  end if;
end
$$;
