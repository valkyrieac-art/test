-- 청소년미래도전프로젝트 활동관리 시스템
-- Supabase SQL Editor에서 전체 실행하세요.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  attendees text[] not null default '{}',
  place text not null,
  title text not null,
  content text not null,
  photo_url text,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null,
  amount numeric(12, 0) not null check (amount >= 0),
  vendor text not null,
  purpose text not null,
  category text not null check (category in ('식비', '교통비', '물품구입', '체험활동', '기타')),
  receipt_url text,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  received_on date not null,
  amount numeric(12, 0) not null check (amount >= 0),
  source text not null,
  purpose text not null,
  category text not null check (category in ('지원금', '후원금', '환불', '이월금', '기타')),
  document_url text,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_amount numeric(12, 0) not null check (total_amount >= 0),
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists activities_date_idx on public.activities(date desc);
create index if not exists expenses_spent_on_idx on public.expenses(spent_on desc);
create index if not exists expenses_category_idx on public.expenses(category);
create index if not exists incomes_received_on_idx on public.incomes(received_on desc);
create index if not exists incomes_category_idx on public.incomes(category);
create index if not exists budgets_active_idx on public.budgets(is_active);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at before update on public.activities for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses for each row execute function public.set_updated_at();

drop trigger if exists incomes_set_updated_at on public.incomes;
create trigger incomes_set_updated_at before update on public.incomes for each row execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at before update on public.budgets for each row execute function public.set_updated_at();

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when new.raw_user_meta_data->>'role' = 'admin' then 'admin' else 'user' end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.keep_single_active_budget()
returns trigger
language plpgsql
as $$
begin
  if new.is_active then
    update public.budgets
    set is_active = false
    where id <> new.id
      and is_active = true;
  end if;
  return new;
end;
$$;

drop trigger if exists budgets_keep_single_active on public.budgets;
create trigger budgets_keep_single_active after insert or update of is_active on public.budgets for each row execute function public.keep_single_active_budget();

alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.budgets enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles for insert to authenticated with check (public.is_admin());
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles for delete to authenticated using (public.is_admin());

drop policy if exists "activities_select_authenticated" on public.activities;
create policy "activities_select_authenticated" on public.activities for select to authenticated using (true);
drop policy if exists "activities_insert_admin" on public.activities;
create policy "activities_insert_admin" on public.activities for insert to authenticated with check (public.is_admin());
drop policy if exists "activities_update_admin" on public.activities;
create policy "activities_update_admin" on public.activities for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "activities_delete_admin" on public.activities;
create policy "activities_delete_admin" on public.activities for delete to authenticated using (public.is_admin());

drop policy if exists "expenses_select_authenticated" on public.expenses;
create policy "expenses_select_authenticated" on public.expenses for select to authenticated using (true);
drop policy if exists "expenses_insert_admin" on public.expenses;
create policy "expenses_insert_admin" on public.expenses for insert to authenticated with check (public.is_admin());
drop policy if exists "expenses_update_admin" on public.expenses;
create policy "expenses_update_admin" on public.expenses for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "expenses_delete_admin" on public.expenses;
create policy "expenses_delete_admin" on public.expenses for delete to authenticated using (public.is_admin());

drop policy if exists "incomes_select_authenticated" on public.incomes;
create policy "incomes_select_authenticated" on public.incomes for select to authenticated using (true);
drop policy if exists "incomes_insert_admin" on public.incomes;
create policy "incomes_insert_admin" on public.incomes for insert to authenticated with check (public.is_admin());
drop policy if exists "incomes_update_admin" on public.incomes;
create policy "incomes_update_admin" on public.incomes for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "incomes_delete_admin" on public.incomes;
create policy "incomes_delete_admin" on public.incomes for delete to authenticated using (public.is_admin());

drop policy if exists "budgets_select_authenticated" on public.budgets;
create policy "budgets_select_authenticated" on public.budgets for select to authenticated using (true);
drop policy if exists "budgets_insert_admin" on public.budgets;
create policy "budgets_insert_admin" on public.budgets for insert to authenticated with check (public.is_admin());
drop policy if exists "budgets_update_admin" on public.budgets;
create policy "budgets_update_admin" on public.budgets for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "budgets_delete_admin" on public.budgets;
create policy "budgets_delete_admin" on public.budgets for delete to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "attachments_public_select" on storage.objects;
create policy "attachments_public_select" on storage.objects for select using (bucket_id = 'attachments');
drop policy if exists "attachments_admin_insert" on storage.objects;
create policy "attachments_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'attachments' and public.is_admin());
drop policy if exists "attachments_admin_update" on storage.objects;
create policy "attachments_admin_update" on storage.objects for update to authenticated using (bucket_id = 'attachments' and public.is_admin()) with check (bucket_id = 'attachments' and public.is_admin());
drop policy if exists "attachments_admin_delete" on storage.objects;
create policy "attachments_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'attachments' and public.is_admin());

-- 테스트 계정은 Supabase Authentication > Users에서 다음 이메일/비밀번호로 생성하세요.
-- 관리자: admin@youth-future-plus.local / 1234
-- 사용자1: test1@youth-future-plus.local / test1
-- 사용자2: test2@youth-future-plus.local / test2
--
-- 생성 후 SQL Editor에서 역할과 이름을 맞춥니다.
-- update public.profiles set role = 'admin', full_name = '관리자' where email = 'admin@youth-future-plus.local';
-- update public.profiles set role = 'user', full_name = '사용자1' where email = 'test1@youth-future-plus.local';
-- update public.profiles set role = 'user', full_name = '사용자2' where email = 'test2@youth-future-plus.local';
