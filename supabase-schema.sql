-- Run this in the Supabase SQL editor

-- Year configs (unchanged)
create table if not exists year_configs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  year integer not null,
  initial_balance numeric(12,2) default 0,
  unique(user_id, year)
);

-- Months: only meta (confirmed + override)
create table if not exists months (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  year integer not null,
  month integer not null,
  confirmed boolean default false,
  gastos_ex_override numeric(12,2) default null,
  primary key (user_id, id)
);

-- Income items: one row per income source per month
create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  year integer not null,
  month integer not null,
  name text not null,
  amount numeric(12,2) not null default 0,
  note text,
  sort_order integer default 0,
  unique(user_id, year, month, name)
);

-- Expense items: one row per expense category per month
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  year integer not null,
  month integer not null,
  name text not null,
  amount numeric(12,2) not null default 0,
  note text,
  sort_order integer default 0,
  unique(user_id, year, month, name)
);

-- Investment items: one row per investment allocation per month
create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  year integer not null,
  month integer not null,
  name text not null,
  amount numeric(12,2) not null default 0,
  note text,
  sort_order integer default 0,
  unique(user_id, year, month, name)
);

-- Enable Row Level Security
alter table months enable row level security;
alter table year_configs enable row level security;
alter table income enable row level security;
alter table expenses enable row level security;
alter table investments enable row level security;

-- RLS Policies
create policy "Users can manage own months" on months for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own year_configs" on year_configs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own income" on income for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own expenses" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own investments" on investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
