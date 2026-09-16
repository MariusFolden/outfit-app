-- Phase 2: private outfit library schema

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  photo_path text not null,
  name text,
  notes text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outfits_name_length check (name is null or char_length(btrim(name)) between 1 and 120),
  constraint outfits_notes_length check (notes is null or char_length(btrim(notes)) between 1 and 2000)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(btrim(name)) between 1 and 40)
);

create table public.outfit_categories (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (outfit_id, category_id)
);

create unique index categories_user_id_name_ci_idx
  on public.categories (user_id, lower(name));

create index outfits_user_id_created_at_idx
  on public.outfits (user_id, created_at desc);

create index outfits_user_id_favorites_created_at_idx
  on public.outfits (user_id, created_at desc)
  where is_favorite;

create index outfit_categories_category_id_outfit_id_idx
  on public.outfit_categories (category_id, outfit_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger outfits_set_updated_at
before update on public.outfits
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.categories (user_id, name)
  values
    (new.id, 'Casual'),
    (new.id, 'School'),
    (new.id, 'Work'),
    (new.id, 'Party'),
    (new.id, 'Date'),
    (new.id, 'Formal'),
    (new.id, 'Gym'),
    (new.id, 'Vacation')
  on conflict do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.outfits enable row level security;
alter table public.categories enable row level security;
alter table public.outfit_categories enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.outfits from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.outfit_categories from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.outfits to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, delete on table public.outfit_categories to authenticated;

create policy "Users can view their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can view their own outfits"
on public.outfits for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own outfits"
on public.outfits for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own outfits"
on public.outfits for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own outfits"
on public.outfits for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their own categories"
on public.categories for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own categories"
on public.categories for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own categories"
on public.categories for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own categories"
on public.categories for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their own outfit categories"
on public.outfit_categories for select to authenticated
using (
  exists (
    select 1
    from public.outfits
    where outfits.id = outfit_categories.outfit_id
      and outfits.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.categories
    where categories.id = outfit_categories.category_id
      and categories.user_id = (select auth.uid())
  )
);

create policy "Users can assign their own categories to their own outfits"
on public.outfit_categories for insert to authenticated
with check (
  exists (
    select 1
    from public.outfits
    where outfits.id = outfit_categories.outfit_id
      and outfits.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.categories
    where categories.id = outfit_categories.category_id
      and categories.user_id = (select auth.uid())
  )
);

create policy "Users can remove their own outfit categories"
on public.outfit_categories for delete to authenticated
using (
  exists (
    select 1
    from public.outfits
    where outfits.id = outfit_categories.outfit_id
      and outfits.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.categories
    where categories.id = outfit_categories.category_id
      and categories.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'outfit-photos',
  'outfit-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can view their own outfit photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'outfits'
);

create policy "Users can upload their own outfit photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'outfits'
);

create policy "Users can update their own outfit photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'outfits'
)
with check (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'outfits'
);

create policy "Users can delete their own outfit photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] = 'outfits'
);
