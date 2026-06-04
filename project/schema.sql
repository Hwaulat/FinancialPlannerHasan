-- ============================================================
-- Catat — Aplikasi Keuangan Pribadi
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  date        date not null,
  title       text not null,
  amount      bigint not null check (amount > 0),
  type        text not null,   -- income | spending | savings | bills | goals | debt_payment | debt_new
  cat         text not null,
  pay         text default 'Cash',
  note        text
);

create table if not exists budgets (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  cat         text not null,
  amount      bigint not null check (amount > 0),
  month       text not null,   -- format: '2026-06'
  unique (cat, month)
);

create table if not exists bills (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text not null,
  amount      bigint not null check (amount > 0),
  due_day     int not null check (due_day between 1 and 31),
  month       text not null,   -- format: '2026-06'
  status      text default 'unpaid' check (status in ('paid','unpaid'))
);

create table if not exists debts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text not null,
  total       bigint not null check (total > 0),
  paid        bigint default 0,
  cat         text,
  icon        text default 'hand'
);

create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text not null,
  target      numeric not null check (target > 0),
  progress    numeric default 0,
  unit        text default 'Rp',
  icon        text default 'flag'
);

-- Nonaktifkan RLS (single-user personal app)
alter table transactions  disable row level security;
alter table budgets        disable row level security;
alter table bills          disable row level security;
alter table debts          disable row level security;
alter table goals          disable row level security;
