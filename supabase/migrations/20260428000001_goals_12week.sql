-- 12 Week Year goal structure
alter table goals add column if not exists vision text;
alter table goals add column if not exists start_date date default current_date;
alter table goals add column if not exists end_date date default (current_date + interval '84 days');
alter table goals drop column if exists progress;

-- Goal ↔ habit many-to-many (lead indicators)
create table if not exists goal_habits (
  id       uuid primary key default gen_random_uuid(),
  goal_id  uuid references goals(id) on delete cascade,
  habit_id uuid references habits(id) on delete cascade,
  unique(goal_id, habit_id)
);

-- Direct goal link on tasks so tactics don't need a project intermediary
alter table tasks add column if not exists goal_id uuid references goals(id) on delete set null;
