-- Run this in the Supabase SQL editor

-- Months table
create table if not exists months (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  year integer not null,
  month integer not null,
  confirmed boolean default false,
  income jsonb default '{}'::jsonb,
  expenses jsonb default '{}'::jsonb,
  gastos_ex_override numeric(12,2) default null,
  savings jsonb default '{}'::jsonb,
  custom_income jsonb default '[]'::jsonb,
  custom_expenses jsonb default '[]'::jsonb,
  custom_investments jsonb default '[]'::jsonb,
  hidden_fields jsonb default '[]'::jsonb,
  primary key (user_id, id)
);

-- Year configs table
create table if not exists year_configs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  year integer not null,
  initial_balance numeric(12,2) default 0,
  unique(user_id, year)
);

-- Enable Row Level Security
alter table months enable row level security;
alter table year_configs enable row level security;

-- RLS Policies
create policy "Users can manage own months"
  on months for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own year_configs"
  on year_configs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Migration for existing tables (run if table already exists)
alter table months add column if not exists hidden_fields jsonb default '[]'::jsonb;
alter table months add column if not exists custom_income jsonb default '[]'::jsonb;
