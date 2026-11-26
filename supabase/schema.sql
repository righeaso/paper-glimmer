-- 紙間微光 (Paper Glimmer) Supabase Schema & RLS Policies
-- 可於 Supabase SQL Editor 執行以建立或補齊對應欄位與存取權限

-- 1. 使用者筆名檔案 (profiles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '山城旅人',
  bio text not null default '在霧氣與茶香之間，收集每個安靜卻發亮的日常片段。',
  writing_days integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 2. 日記文章 (diaries) - 同時包含 user_id 與 author_id（對應 profiles.id）
create table if not exists public.diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  mood text not null check (mood in ('平靜', '微光', '低潮', '思考')),
  title text not null,
  content text not null,
  published_date text not null,
  entry_date text not null,
  is_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. 心情回應 (reactions)
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.diaries(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('暖心拍拍', '深深共鳴', '替你加油', '會心一笑')),
  created_at timestamptz not null default now(),
  unique (diary_id, from_user_id)
);

-- 4. 雙向解鎖後的一對一訊息 (messages)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 啟用 Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.diaries enable row level security;
alter table public.reactions enable row level security;
alter table public.messages enable row level security;

-- Profiles 權限：已登入使用者可讀取筆名、僅可寫入自己的資料
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Diaries 權限：已登入使用者可讀日記牆、僅可新增與修改自己的日記
create policy "diaries_select_authenticated" on public.diaries
  for select to authenticated using (true);
create policy "diaries_insert_own" on public.diaries
  for insert to authenticated
  with check (auth.uid() = author_id and auth.uid() = user_id);
create policy "diaries_update_own" on public.diaries
  for update to authenticated
  using (auth.uid() = author_id or auth.uid() = user_id);

-- Reactions 權限：已登入使用者可讀相關回應、僅可對他人日記新增/更新/刪除自己的回應
create policy "reactions_select_involved" on public.reactions
  for select to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "reactions_insert_own" on public.reactions
  for insert to authenticated
  with check (auth.uid() = from_user_id and from_user_id <> to_user_id);
create policy "reactions_update_own" on public.reactions
  for update to authenticated using (auth.uid() = from_user_id);
create policy "reactions_delete_own" on public.reactions
  for delete to authenticated using (auth.uid() = from_user_id);

-- Messages 權限：僅對話雙方可讀寫訊息
create policy "messages_select_participants" on public.messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "messages_insert_own" on public.messages
  for insert to authenticated
  with check (auth.uid() = sender_id);
