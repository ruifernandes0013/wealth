-- 2025 extraordinary (investments) seed
-- Run in the Supabase SQL editor.

do $$
declare
  uid uuid := '7e030412-09d4-40cc-b0fb-36a7971ca5ff';
begin

  -- Savings Acc. (CONTAS)
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Savings Acc.',  5.51, 0),
    (uid, 2025,  2, 'Savings Acc.',  9.98, 0),
    (uid, 2025,  3, 'Savings Acc.',  2.08, 0),
    (uid, 2025,  4, 'Savings Acc.',  3.44, 0),
    (uid, 2025,  5, 'Savings Acc.',  5.51, 0),
    (uid, 2025,  6, 'Savings Acc.',  3.43, 0),
    (uid, 2025,  7, 'Savings Acc.',  0.04, 0),
    (uid, 2025,  8, 'Savings Acc.',  2.39, 0),
    (uid, 2025,  9, 'Savings Acc.',  5.51, 0),
    (uid, 2025, 10, 'Savings Acc.',  2.39, 0),
    (uid, 2025, 11, 'Savings Acc.',  2.57, 0),
    (uid, 2025, 12, 'Savings Acc.',  2.39, 0)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Holidays (FÉRIAS)
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Holidays',    0.00, 1),
    (uid, 2025,  2, 'Holidays',  523.62, 1),
    (uid, 2025,  3, 'Holidays',    0.00, 1),
    (uid, 2025,  4, 'Holidays',    0.00, 1),
    (uid, 2025,  5, 'Holidays',    0.00, 1),
    (uid, 2025,  6, 'Holidays',  287.24, 1),
    (uid, 2025,  7, 'Holidays',    0.00, 1),
    (uid, 2025,  8, 'Holidays',    0.00, 1),
    (uid, 2025,  9, 'Holidays',    0.00, 1),
    (uid, 2025, 10, 'Holidays',  463.59, 1),
    (uid, 2025, 11, 'Holidays',  874.22, 1),
    (uid, 2025, 12, 'Holidays',   30.00, 1)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- T1 Felgueiras (T1+1 Felgueiras)
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'T1 Felgueiras',    0.00, 2),
    (uid, 2025,  2, 'T1 Felgueiras',    0.00, 2),
    (uid, 2025,  3, 'T1 Felgueiras',    0.00, 2),
    (uid, 2025,  4, 'T1 Felgueiras',    0.00, 2),
    (uid, 2025,  5, 'T1 Felgueiras',    0.00, 2),
    (uid, 2025,  6, 'T1 Felgueiras',   61.84, 2),
    (uid, 2025,  7, 'T1 Felgueiras',    0.00, 2),
    (uid, 2025,  8, 'T1 Felgueiras',    0.00, 2),
    (uid, 2025,  9, 'T1 Felgueiras', 2155.00, 2),
    (uid, 2025, 10, 'T1 Felgueiras',    0.00, 2),
    (uid, 2025, 11, 'T1 Felgueiras',   68.04, 2),
    (uid, 2025, 12, 'T1 Felgueiras',  221.40, 2)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- T1 Esposende
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'T1 Esposende',     0.00, 3),
    (uid, 2025,  2, 'T1 Esposende',     0.00, 3),
    (uid, 2025,  3, 'T1 Esposende',     0.00, 3),
    (uid, 2025,  4, 'T1 Esposende',     0.00, 3),
    (uid, 2025,  5, 'T1 Esposende',     0.00, 3),
    (uid, 2025,  6, 'T1 Esposende',     0.00, 3),
    (uid, 2025,  7, 'T1 Esposende',     0.00, 3),
    (uid, 2025,  8, 'T1 Esposende',     0.00, 3),
    (uid, 2025,  9, 'T1 Esposende',     0.00, 3),
    (uid, 2025, 10, 'T1 Esposende', 20239.20, 3),
    (uid, 2025, 11, 'T1 Esposende',  6578.03, 3),
    (uid, 2025, 12, 'T1 Esposende',   110.96, 3)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- T1 Fradelos
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'T1 Fradelos',     0.00, 4),
    (uid, 2025,  2, 'T1 Fradelos',     0.00, 4),
    (uid, 2025,  3, 'T1 Fradelos', 13600.00, 4),
    (uid, 2025,  4, 'T1 Fradelos', 17377.30, 4),
    (uid, 2025,  5, 'T1 Fradelos',  5295.20, 4),
    (uid, 2025,  6, 'T1 Fradelos',     7.86, 4),
    (uid, 2025,  7, 'T1 Fradelos',     0.00, 4),
    (uid, 2025,  8, 'T1 Fradelos',     0.00, 4),
    (uid, 2025,  9, 'T1 Fradelos',     0.00, 4),
    (uid, 2025, 10, 'T1 Fradelos',     0.00, 4),
    (uid, 2025, 11, 'T1 Fradelos',     0.00, 4),
    (uid, 2025, 12, 'T1 Fradelos',     0.00, 4)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Wedding (Casamento)
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Wedding',    0.00, 5),
    (uid, 2025,  2, 'Wedding',    0.00, 5),
    (uid, 2025,  3, 'Wedding',    0.00, 5),
    (uid, 2025,  4, 'Wedding',    0.00, 5),
    (uid, 2025,  5, 'Wedding',    0.00, 5),
    (uid, 2025,  6, 'Wedding',    0.00, 5),
    (uid, 2025,  7, 'Wedding',  375.00, 5),
    (uid, 2025,  8, 'Wedding',    0.00, 5),
    (uid, 2025,  9, 'Wedding',    0.00, 5),
    (uid, 2025, 10, 'Wedding',  330.00, 5),
    (uid, 2025, 11, 'Wedding',  582.50, 5),
    (uid, 2025, 12, 'Wedding',    0.00, 5)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Gold (Ouro)
  insert into investments (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Gold',    0.00, 7),
    (uid, 2025,  2, 'Gold',    0.00, 7),
    (uid, 2025,  3, 'Gold',    0.00, 7),
    (uid, 2025,  4, 'Gold',    0.00, 7),
    (uid, 2025,  5, 'Gold',    0.00, 7),
    (uid, 2025,  6, 'Gold', 1953.00, 7),
    (uid, 2025,  7, 'Gold',    0.00, 7),
    (uid, 2025,  8, 'Gold',    0.00, 7),
    (uid, 2025,  9, 'Gold',    0.00, 7),
    (uid, 2025, 10, 'Gold',    0.00, 7),
    (uid, 2025, 11, 'Gold',    0.00, 7),
    (uid, 2025, 12, 'Gold',    0.00, 7)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

end $$;
