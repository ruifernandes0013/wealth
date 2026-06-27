-- 2024 extraordinary (investments) seed: Savings Acc., Holidays, T1 Felgueiras
-- Run in the Supabase SQL editor.

do $$
declare
 uid uuid := '7e030412-09d4-40cc-b0fb-36a7971ca5ff';
begin

  -- Savings Acc. (CONTAS)
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Savings Acc.',   0.00, 0),
    (uid, 2024,  2, 'Savings Acc.',   0.00, 0),
    (uid, 2024,  3, 'Savings Acc.',   0.00, 0),
    (uid, 2024,  4, 'Savings Acc.',   0.00, 0),
    (uid, 2024,  5, 'Savings Acc.',   0.00, 0),
    (uid, 2024,  6, 'Savings Acc.',   0.00, 0),
    (uid, 2024,  7, 'Savings Acc.',   0.00, 0),
    (uid, 2024,  8, 'Savings Acc.',   2.08, 0),
    (uid, 2024,  9, 'Savings Acc.',   0.00, 0),
    (uid, 2024, 10, 'Savings Acc.',   9.97, 0),
    (uid, 2024, 11, 'Savings Acc.',   9.98, 0),
    (uid, 2024, 12, 'Savings Acc.',  10.02, 0)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Holidays (FÉRIAS)
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Holidays',    0.00, 1),
    (uid, 2024,  2, 'Holidays',    0.00, 1),
    (uid, 2024,  3, 'Holidays',    0.00, 1),
    (uid, 2024,  4, 'Holidays',    0.00, 1),
    (uid, 2024,  5, 'Holidays',    0.00, 1),
    (uid, 2024,  6, 'Holidays',    0.00, 1),
    (uid, 2024,  7, 'Holidays',  600.00, 1),
    (uid, 2024,  8, 'Holidays',    0.00, 1),
    (uid, 2024,  9, 'Holidays',  131.36, 1),
    (uid, 2024, 10, 'Holidays',  471.59, 1),
    (uid, 2024, 11, 'Holidays',    0.00, 1),
    (uid, 2024, 12, 'Holidays',    0.00, 1)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- T1 Felgueiras (FELGUEIRAS)
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'T1 Felgueiras',     0.00, 2),
    (uid, 2024,  2, 'T1 Felgueiras',     0.00, 2),
    (uid, 2024,  3, 'T1 Felgueiras',     0.00, 2),
    (uid, 2024,  4, 'T1 Felgueiras',     0.00, 2),
    (uid, 2024,  5, 'T1 Felgueiras',     0.00, 2),
    (uid, 2024,  6, 'T1 Felgueiras', 12739.20, 2),
    (uid, 2024,  7, 'T1 Felgueiras',  4781.16, 2),
    (uid, 2024,  8, 'T1 Felgueiras',   573.20, 2),
    (uid, 2024,  9, 'T1 Felgueiras',     0.00, 2),
    (uid, 2024, 10, 'T1 Felgueiras',     0.00, 2),
    (uid, 2024, 11, 'T1 Felgueiras',  1019.17, 2),
    (uid, 2024, 12, 'T1 Felgueiras',     0.00, 2)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

end $$;
