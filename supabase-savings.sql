-- Migration: add savings accounts table
-- Run this in the Supabase SQL editor.

create table if not exists savings (
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

alter table savings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'savings' and policyname = 'Users can manage own savings') then
    create policy "Users can manage own savings" on savings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
