-- Migration: add updated_at / updated_by tracking to all tables
-- Run this in the Supabase SQL editor.

alter table months           add column if not exists updated_at timestamptz not null default now();
alter table months           add column if not exists updated_by uuid references auth.users(id);

alter table year_configs     add column if not exists updated_at timestamptz not null default now();
alter table year_configs     add column if not exists updated_by uuid references auth.users(id);

alter table income           add column if not exists updated_at timestamptz not null default now();
alter table income           add column if not exists updated_by uuid references auth.users(id);

alter table expenses         add column if not exists updated_at timestamptz not null default now();
alter table expenses         add column if not exists updated_by uuid references auth.users(id);

alter table investments      add column if not exists updated_at timestamptz not null default now();
alter table investments      add column if not exists updated_by uuid references auth.users(id);

alter table savings          add column if not exists updated_at timestamptz not null default now();
alter table savings          add column if not exists updated_by uuid references auth.users(id);

alter table user_preferences add column if not exists updated_at timestamptz not null default now();
alter table user_preferences add column if not exists updated_by uuid references auth.users(id);

-- Auto-populate both columns on every insert/update, regardless of what the client sends.
create or replace function set_audit_columns() returns trigger as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_set_audit on months;
create trigger trg_set_audit before insert or update on months
for each row execute function set_audit_columns();

drop trigger if exists trg_set_audit on year_configs;
create trigger trg_set_audit before insert or update on year_configs
for each row execute function set_audit_columns();

drop trigger if exists trg_set_audit on income;
create trigger trg_set_audit before insert or update on income
for each row execute function set_audit_columns();

drop trigger if exists trg_set_audit on expenses;
create trigger trg_set_audit before insert or update on expenses
for each row execute function set_audit_columns();

drop trigger if exists trg_set_audit on investments;
create trigger trg_set_audit before insert or update on investments
for each row execute function set_audit_columns();

drop trigger if exists trg_set_audit on savings;
create trigger trg_set_audit before insert or update on savings
for each row execute function set_audit_columns();

drop trigger if exists trg_set_audit on user_preferences;
create trigger trg_set_audit before insert or update on user_preferences
for each row execute function set_audit_columns();

-- Note: this trigger runs BEFORE the audit_log triggers from supabase-audit-log.sql,
-- so old_data/new_data captured there will already include updated_at/updated_by.
