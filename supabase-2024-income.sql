-- 2024 income seed: Salary + Felgueiras
-- Run in the Supabase SQL editor.
-- Uses the single existing user automatically.

do $$
declare
  uid uuid := '7e030412-09d4-40cc-b0fb-36a7971ca5ff';
begin

  -- 2024 months (upsert so safe to re-run)
  insert into months (id, user_id, year, month, confirmed)
  values
    ('2024-01', uid, 2024,  1, true),
    ('2024-02', uid, 2024,  2, true),
    ('2024-03', uid, 2024,  3, true),
    ('2024-04', uid, 2024,  4, true),
    ('2024-05', uid, 2024,  5, true),
    ('2024-06', uid, 2024,  6, true),
    ('2024-07', uid, 2024,  7, true),
    ('2024-08', uid, 2024,  8, true),
    ('2024-09', uid, 2024,  9, true),
    ('2024-10', uid, 2024, 10, true),
    ('2024-11', uid, 2024, 11, true),
    ('2024-12', uid, 2024, 12, true)
  on conflict (id) do nothing;

  -- 2024 year config (initialBalance = 0, adjust if needed)
  insert into year_configs (user_id, year, initial_balance)
  values (uid, 2024, 0)
  on conflict (user_id, year) do nothing;

  -- Income: Salary
  insert into income (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Salary',  2272.00,   0),
    (uid, 2024,  2, 'Salary',  1431.00,   0),
    (uid, 2024,  3, 'Salary',  1716.00,   0),
    (uid, 2024,  4, 'Salary',  3104.36,   0),
    (uid, 2024,  5, 'Salary',  2252.52,   0),
    (uid, 2024,  6, 'Salary',  2442.52,   0),
    (uid, 2024,  7, 'Salary',  2888.40,   0),
    (uid, 2024,  8, 'Salary',  3354.14,   0),
    (uid, 2024,  9, 'Salary',  2160.87,   0),
    (uid, 2024, 10, 'Salary',  3961.00,   0),
    (uid, 2024, 11, 'Salary',  2717.00,   0),
    (uid, 2024, 12, 'Salary',  4314.02,   0)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Income: Felgueiras
  insert into income (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Felgueiras',    0.00, 1),
    (uid, 2024,  2, 'Felgueiras',    0.00, 1),
    (uid, 2024,  3, 'Felgueiras',    0.00, 1),
    (uid, 2024,  4, 'Felgueiras',    0.00, 1),
    (uid, 2024,  5, 'Felgueiras',    0.00, 1),
    (uid, 2024,  6, 'Felgueiras',    0.00, 1),
    (uid, 2024,  7, 'Felgueiras',    0.00, 1),
    (uid, 2024,  8, 'Felgueiras', 1625.00, 1),
    (uid, 2024,  9, 'Felgueiras',  650.00, 1),
    (uid, 2024, 10, 'Felgueiras',  650.00, 1),
    (uid, 2024, 11, 'Felgueiras',  650.00, 1),
    (uid, 2024, 12, 'Felgueiras',  650.00, 1)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

end $$;
