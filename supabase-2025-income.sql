-- 2025 income seed: Felgueiras, Fradelos, DocBay, Salary
-- Run in the Supabase SQL editor.

do $$
declare
  uid uuid := '7e030412-09d4-40cc-b0fb-36a7971ca5ff';
begin

  -- 2025 months
  insert into months (id, user_id, year, month, confirmed)
  values
    ('2025-01', uid, 2025,  1, true),
    ('2025-02', uid, 2025,  2, true),
    ('2025-03', uid, 2025,  3, true),
    ('2025-04', uid, 2025,  4, true),
    ('2025-05', uid, 2025,  5, true),
    ('2025-06', uid, 2025,  6, true),
    ('2025-07', uid, 2025,  7, true),
    ('2025-08', uid, 2025,  8, true),
    ('2025-09', uid, 2025,  9, true),
    ('2025-10', uid, 2025, 10, true),
    ('2025-11', uid, 2025, 11, true),
    ('2025-12', uid, 2025, 12, true)
  on conflict do nothing;

  -- 2025 year config (initialBalance = 0, adjust if needed)
  insert into year_configs (user_id, year, initial_balance)
  values (uid, 2025, 0)
  on conflict (user_id, year) do nothing;

  -- Felgueiras
  insert into income (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Felgueiras',  650.00, 1),
    (uid, 2025,  2, 'Felgueiras',  650.00, 1),
    (uid, 2025,  3, 'Felgueiras',  650.00, 1),
    (uid, 2025,  4, 'Felgueiras',  650.00, 1),
    (uid, 2025,  5, 'Felgueiras',  670.89, 1),
    (uid, 2025,  6, 'Felgueiras',  650.00, 1),
    (uid, 2025,  7, 'Felgueiras',  650.00, 1),
    (uid, 2025,  8, 'Felgueiras',  664.04, 1),
    (uid, 2025,  9, 'Felgueiras', 2040.00, 1),
    (uid, 2025, 10, 'Felgueiras',  655.00, 1),
    (uid, 2025, 11, 'Felgueiras',  680.00, 1),
    (uid, 2025, 12, 'Felgueiras',    0.00, 1)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Fradelos
  insert into income (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Fradelos',    0.00, 2),
    (uid, 2025,  2, 'Fradelos',    0.00, 2),
    (uid, 2025,  3, 'Fradelos',    0.00, 2),
    (uid, 2025,  4, 'Fradelos', 1500.00, 2),
    (uid, 2025,  5, 'Fradelos',  600.00, 2),
    (uid, 2025,  6, 'Fradelos',  600.00, 2),
    (uid, 2025,  7, 'Fradelos',  600.00, 2),
    (uid, 2025,  8, 'Fradelos',  600.00, 2),
    (uid, 2025,  9, 'Fradelos',  600.00, 2),
    (uid, 2025, 10, 'Fradelos',  600.00, 2),
    (uid, 2025, 11, 'Fradelos',  600.00, 2),
    (uid, 2025, 12, 'Fradelos',    0.00, 2)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- DocBay
  insert into income (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'DocBay',    0.00, 3),
    (uid, 2025,  2, 'DocBay',    0.00, 3),
    (uid, 2025,  3, 'DocBay',    0.00, 3),
    (uid, 2025,  4, 'DocBay',    0.00, 3),
    (uid, 2025,  5, 'DocBay',    0.00, 3),
    (uid, 2025,  6, 'DocBay',    0.00, 3),
    (uid, 2025,  7, 'DocBay',    0.00, 3),
    (uid, 2025,  8, 'DocBay',    0.00, 3),
    (uid, 2025,  9, 'DocBay', 1100.00, 3),
    (uid, 2025, 10, 'DocBay', 1100.00, 3),
    (uid, 2025, 11, 'DocBay', 1100.00, 3),
    (uid, 2025, 12, 'DocBay',    0.00, 3)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Salary (INCOME)
  insert into income (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Salary', 3400.22, 4),
    (uid, 2025,  2, 'Salary', 3386.25, 4),
    (uid, 2025,  3, 'Salary', 3097.63, 4),
    (uid, 2025,  4, 'Salary', 7268.11, 4),
    (uid, 2025,  5, 'Salary', 5449.99, 4),
    (uid, 2025,  6, 'Salary', 7517.56, 4),
    (uid, 2025,  7, 'Salary', 4243.39, 4),
    (uid, 2025,  8, 'Salary', 4238.39, 4),
    (uid, 2025,  9, 'Salary', 5674.67, 4),
    (uid, 2025, 10, 'Salary', 5015.39, 4),
    (uid, 2025, 11, 'Salary', 8010.59, 4),
    (uid, 2025, 12, 'Salary', 4256.39, 4)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

end $$;
