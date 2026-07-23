-- Migration: audit log for line-item changes (income, expenses, investments, savings)
-- Run this in the Supabase SQL editor.
-- Lets you answer "what changed between yesterday and today" for any of these tables.

create table if not exists audit_log (
  id bigserial primary key,
  table_name text not null,
  row_id text not null,
  user_id uuid not null,
  operation text not null, -- INSERT | UPDATE | DELETE
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists audit_log_lookup on audit_log (user_id, table_name, changed_at desc);

alter table audit_log enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'audit_log' and policyname = 'Users can view own audit log') then
    create policy "Users can view own audit log" on audit_log for select using (auth.uid() = user_id);
  end if;
end $$;

create or replace function audit_trigger_fn() returns trigger as $$
declare
  v_user_id uuid;
  v_row_id text;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  v_row_id := coalesce(new.id, old.id)::text;
  insert into audit_log (table_name, row_id, user_id, operation, old_data, new_data)
  values (
    TG_TABLE_NAME,
    v_row_id,
    v_user_id,
    TG_OP,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trg_audit on income;
create trigger trg_audit after insert or update or delete on income
for each row execute function audit_trigger_fn();

drop trigger if exists trg_audit on expenses;
create trigger trg_audit after insert or update or delete on expenses
for each row execute function audit_trigger_fn();

drop trigger if exists trg_audit on investments;
create trigger trg_audit after insert or update or delete on investments
for each row execute function audit_trigger_fn();

drop trigger if exists trg_audit on savings;
create trigger trg_audit after insert or update or delete on savings
for each row execute function audit_trigger_fn();

-- Example query — everything that changed on your expenses in the last 2 days:
--
-- select changed_at, operation, old_data ->> 'name' as name,
--        old_data ->> 'amount' as old_amount, new_data ->> 'amount' as new_amount
-- from audit_log
-- where table_name = 'expenses' and changed_at > now() - interval '2 days'
-- order by changed_at desc;
