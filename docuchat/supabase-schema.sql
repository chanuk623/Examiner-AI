-- ============================================
-- ExaminerAI — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. PROFILES TABLE
-- Stores user info + admin approval status
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text default 'examiner' check (role in ('admin', 'examiner')),
  approved boolean default false,
  storage_used_bytes bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. DOCUMENTS TABLE
-- Stores metadata for every uploaded file
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  file_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  is_image boolean default false,
  mime_type text,
  created_at timestamptz default now()
);

-- 3. STORAGE BUCKET
-- Create the documents bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800, -- 50MB per file limit
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do nothing;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- PROFILES policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- DOCUMENTS policies
create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- STORAGE policies
create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own files"
  on storage.objects for select
  using (
    bucket_id = 'documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, approved)
  values (new.id, new.email, false);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on new auth user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to update storage usage
create or replace function public.update_storage_used(
  p_user_id uuid,
  p_bytes bigint
)
returns void as $$
begin
  update public.profiles
  set storage_used_bytes = storage_used_bytes + p_bytes,
      updated_at = now()
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- FIRST ADMIN SETUP
-- After you sign in for the first time, run this
-- to make yourself admin and approve yourself:
-- (Replace the email with your actual email)
-- ============================================
-- update public.profiles
-- set role = 'admin', approved = true
-- where email = 'your@email.com';
