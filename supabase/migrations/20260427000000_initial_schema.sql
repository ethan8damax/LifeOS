-- Life OS initial schema
-- Creation order respects FK dependencies:
-- goals → projects → tasks
-- goals → habits → habit_logs
-- transactions and budgets have no FK deps

-- GOALS (no dependencies)
create table goals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  target_date date,
  progress    int default 0,           -- 0–100
  status      text default 'active',
  created_at  timestamptz default now()
);

-- PROJECTS (depends on goals)
create table projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  status      text default 'active',   -- active | paused | done
  goal_id     uuid references goals(id),
  created_at  timestamptz default now()
);

-- TASKS (depends on projects)
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  notes        text,
  status       text default 'todo',    -- todo | in_progress | done
  priority     text default 'medium',  -- low | medium | high
  due_date     date,
  project_id   uuid references projects(id),
  tag          text,
  is_recurring boolean default false,
  recur_rule   text,                   -- daily | weekly | monthly
  created_at   timestamptz default now()
);

-- HABITS (depends on goals)
create table habits (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  frequency   text default 'daily',    -- daily | weekdays | weekly
  goal_id     uuid references goals(id),
  created_at  timestamptz default now()
);

-- HABIT LOGS (depends on habits)
-- One row per check-in; unique constraint prevents duplicate logs per day
create table habit_logs (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid references habits(id),
  logged_date date not null,
  completed   boolean default true,
  unique(habit_id, logged_date)
);

-- TRANSACTIONS (no dependencies)
create table transactions (
  id         uuid primary key default gen_random_uuid(),
  amount     numeric(10,2) not null,
  type       text not null,            -- income | expense
  category   text,
  note       text,
  date       date not null,
  created_at timestamptz default now()
);

-- BUDGETS (no dependencies)
create table budgets (
  id           uuid primary key default gen_random_uuid(),
  category     text not null,
  limit_amount numeric(10,2) not null,
  month        text not null           -- e.g. '2026-04'
);
