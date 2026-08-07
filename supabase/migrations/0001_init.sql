-- 転職コンパス 初期スキーマ（要件定義書 §12 に対応）
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

create extension if not exists "pgcrypto";

-- axis_profiles: ユーザーと1:1。Step1・Step3後半・Step4のサマリー本体
create table if not exists axis_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  will_enjoy_text text not null default '',
  will_drain_text text not null default '',
  can_relied_text text not null default '',
  can_proud_text text not null default '',
  must_market_text text not null default '',
  approach_style_text text not null default '',
  motivation_type text,
  motivation_note text not null default '',
  entry_strength_text text not null default '',
  north_star_text text not null default '',
  north_star_timeframe text,
  allowed_transition_paths text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- axis_anchor_scores: 8アンカー分の行
create table if not exists axis_anchor_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anchor_type text not null,
  score int not null,
  unique (user_id, anchor_type)
);

-- axis_must_conditions: 動的追加のMust条件
create table if not exists axis_must_conditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_label text not null,
  condition_text text not null,
  threshold_value numeric,
  created_at timestamptz not null default now()
);

-- axis_want_categories: 標準7カテゴリ＋ユーザー追加分
create table if not exists axis_want_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_name text not null,
  weight int not null default 0,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

-- selections: 選考プロセス（1応募先＝1レコード）
create table if not exists selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  position text not null default '',
  status text not null default '応募',
  job_reality_check jsonb,
  must_condition_check jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- schedules: 面接日程・締切等
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  selection_id uuid references selections(id) on delete set null,
  title text not null,
  event_datetime timestamptz not null,
  event_type text not null default 'その他',
  note text
);

-- Row Level Security: 全テーブルとも自分の行のみ読み書き可
alter table axis_profiles enable row level security;
alter table axis_anchor_scores enable row level security;
alter table axis_must_conditions enable row level security;
alter table axis_want_categories enable row level security;
alter table selections enable row level security;
alter table schedules enable row level security;

create policy "own rows only" on axis_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on axis_anchor_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on axis_must_conditions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on axis_want_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on selections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
