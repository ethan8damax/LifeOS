-- Finance v2: zero-based budgeting system
-- Replaces transactions + budgets with structured zero-based finance schema

drop table if exists transactions;
drop table if exists budgets;

create table if not exists income_sources (
  id       uuid primary key default gen_random_uuid(),
  owner    text not null,
  name     text not null,
  expected numeric(10,2) default 0,
  actual   numeric(10,2) default 0,
  month    text not null
);

create table if not exists recurring_payments (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  amount numeric(10,2) not null
);

create table if not exists debts (
  id          uuid primary key default gen_random_uuid(),
  owner       text not null,
  name        text not null,
  amount_owed numeric(10,2) default 0,
  due_date    date
);

create table if not exists savings_pods (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  allotted numeric(10,2) default 0,
  goal     numeric(10,2) default 0
);

create table if not exists assets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  account_ref text,
  balance     numeric(10,2) default 0,
  type        text default 'checking'
);

create table if not exists net_worth_snapshots (
  id            uuid primary key default gen_random_uuid(),
  month         text not null,
  total_assets  numeric(10,2),
  total_debt    numeric(10,2),
  net_worth     numeric(10,2),
  snapshot_date date default current_date
);

create table if not exists budget_categories (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  expected numeric(10,2) default 0,
  actual   numeric(10,2) default 0,
  month    text not null
);
