-- Migration: extract JSONB data from months into dedicated income/expenses/investments tables
-- Run this in the Supabase SQL editor AFTER the new schema (supabase-schema.sql) has been applied.

-- ── Step 1: Create new tables (idempotent) ────────────────────────────────────

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

alter table income enable row level security;
alter table expenses enable row level security;
alter table investments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'income' and policyname = 'Users can manage own income') then
    create policy "Users can manage own income" on income for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'expenses' and policyname = 'Users can manage own expenses') then
    create policy "Users can manage own expenses" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'investments' and policyname = 'Users can manage own investments') then
    create policy "Users can manage own investments" on investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- ── Step 2: Migrate income (standard fields from months.income JSONB) ─────────
-- sort_order uses known field order: Esposende=0, Felgueiras=1, Fradelos=2, DocBay=3, Salary=4

insert into income (user_id, year, month, name, amount, note, sort_order)
select
  m.user_id,
  m.year,
  m.month,
  kv.key                                                   as name,
  (kv.value #>> '{}')::numeric                            as amount,
  nullif(m.notes ->> kv.key, '')                          as note,
  case kv.key
    when 'Esposende'  then 0
    when 'Felgueiras' then 1
    when 'Fradelos'   then 2
    when 'DocBay'     then 3
    when 'Salary'     then 4
    else 99
  end                                                      as sort_order
from months m
cross join lateral jsonb_each(coalesce(m.income, '{}')) as kv
where m.income is not null and m.income <> '{}'::jsonb
on conflict (user_id, year, month, name) do update
  set amount = excluded.amount,
      note   = excluded.note;

-- ── Step 4: Migrate expenses (standard fields from months.expenses JSONB) ─────
-- sort_order uses known field order

insert into expenses (user_id, year, month, name, amount, note, sort_order)
select
  m.user_id,
  m.year,
  m.month,
  kv.key                                                   as name,
  (kv.value #>> '{}')::numeric                            as amount,
  nullif(m.notes ->> kv.key, '')                          as note,
  case kv.key
    when 'Mortgage'       then 0
    when 'Condo/Works'    then 1
    when 'Water'          then 2
    when 'Electricity'    then 3
    when 'Internet'       then 4
    when 'Diesel'         then 5
    when 'Food'           then 6
    when 'Mechanic'       then 7
    when 'Netflix'        then 8
    when 'Phone'          then 9
    when 'Gym/Nutrition'  then 10
    when 'Going Out'      then 11
    when 'Other'          then 12
    else 99
  end                                                      as sort_order
from months m
cross join lateral jsonb_each(coalesce(m.expenses, '{}')) as kv
where m.expenses is not null and m.expenses <> '{}'::jsonb
on conflict (user_id, year, month, name) do update
  set amount = excluded.amount,
      note   = excluded.note;

-- ── Step 6: Migrate investments (from months.savings JSONB) ───────────────────
-- sort_order uses known field order

insert into investments (user_id, year, month, name, amount, note, sort_order)
select
  m.user_id,
  m.year,
  m.month,
  kv.key                                                   as name,
  (kv.value #>> '{}')::numeric                            as amount,
  nullif(m.notes ->> kv.key, '')                          as note,
  case kv.key
    when 'Savings Acc.'   then 0
    when 'Holidays'       then 1
    when 'T1 Felgueiras'  then 2
    when 'T1 Esposende'   then 3
    when 'T1 Fradelos'    then 4
    when 'Wedding'        then 5
    when 'Stock Market'   then 6
    when 'Gold'           then 7
    else 99
  end                                                      as sort_order
from months m
cross join lateral jsonb_each(coalesce(m.savings, '{}')) as kv
where m.savings is not null and m.savings <> '{}'::jsonb
on conflict (user_id, year, month, name) do update
  set amount = excluded.amount,
      note   = excluded.note;

-- ── Step 7: Drop old JSONB columns from months (run after verifying data) ─────
-- Uncomment once you've confirmed the migration looks correct:
--
-- alter table months drop column if exists income;
-- alter table months drop column if exists expenses;
-- alter table months drop column if exists savings;
-- alter table months drop column if exists hidden_fields;
-- alter table months drop column if exists notes;

-- ── Verification queries ──────────────────────────────────────────────────────
-- Run these after migration to check row counts:
--
-- select count(*) from income;
-- select count(*) from expenses;
-- select count(*) from investments;
-- select year, month, name, amount from income order by year, month, sort_order;
