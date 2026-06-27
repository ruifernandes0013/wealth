-- 2024 expenses seed
-- Run in the Supabase SQL editor.

do $$
declare
  uid uuid := "7e030412-09d4-40cc-b0fb-36a7971ca5ff";
begin

  -- Mortgage (PRESTAÇÃO)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Mortgage',    0.00, 0),
    (uid, 2024,  2, 'Mortgage',    0.00, 0),
    (uid, 2024,  3, 'Mortgage',    0.00, 0),
    (uid, 2024,  4, 'Mortgage',    0.00, 0),
    (uid, 2024,  5, 'Mortgage',    0.00, 0),
    (uid, 2024,  6, 'Mortgage',    0.00, 0),
    (uid, 2024,  7, 'Mortgage',    0.00, 0),
    (uid, 2024,  8, 'Mortgage',    0.00, 0),
    (uid, 2024,  9, 'Mortgage',  569.64, 0),
    (uid, 2024, 10, 'Mortgage',  428.91, 0),
    (uid, 2024, 11, 'Mortgage',  428.91, 0),
    (uid, 2024, 12, 'Mortgage',  428.91, 0)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Condo/Works (COND&OBRAS)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Condo/Works',   0.00, 1),
    (uid, 2024,  2, 'Condo/Works',   0.00, 1),
    (uid, 2024,  3, 'Condo/Works',   0.00, 1),
    (uid, 2024,  4, 'Condo/Works',   0.00, 1),
    (uid, 2024,  5, 'Condo/Works',   0.00, 1),
    (uid, 2024,  6, 'Condo/Works',   0.00, 1),
    (uid, 2024,  7, 'Condo/Works',   0.00, 1),
    (uid, 2024,  8, 'Condo/Works',   0.00, 1),
    (uid, 2024,  9, 'Condo/Works',   0.00, 1),
    (uid, 2024, 10, 'Condo/Works',   0.00, 1),
    (uid, 2024, 11, 'Condo/Works',   0.00, 1),
    (uid, 2024, 12, 'Condo/Works', 224.44, 1)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Diesel (GÁSOLEO)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Diesel',   80.00, 5),
    (uid, 2024,  2, 'Diesel',  199.07, 5),
    (uid, 2024,  3, 'Diesel',  160.52, 5),
    (uid, 2024,  4, 'Diesel',    0.00, 5),
    (uid, 2024,  5, 'Diesel',  105.44, 5),
    (uid, 2024,  6, 'Diesel',  132.87, 5),
    (uid, 2024,  7, 'Diesel',  132.10, 5),
    (uid, 2024,  8, 'Diesel',  159.58, 5),
    (uid, 2024,  9, 'Diesel',  154.36, 5),
    (uid, 2024, 10, 'Diesel',  192.16, 5),
    (uid, 2024, 11, 'Diesel',   85.05, 5),
    (uid, 2024, 12, 'Diesel',  137.24, 5)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Food (ALIMENTAÇÃO)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Food',   11.95, 6),
    (uid, 2024,  2, 'Food',   53.12, 6),
    (uid, 2024,  3, 'Food',    7.82, 6),
    (uid, 2024,  4, 'Food',  103.33, 6),
    (uid, 2024,  5, 'Food',   61.80, 6),
    (uid, 2024,  6, 'Food',   14.50, 6),
    (uid, 2024,  7, 'Food',   40.75, 6),
    (uid, 2024,  8, 'Food',  108.29, 6),
    (uid, 2024,  9, 'Food',  120.86, 6),
    (uid, 2024, 10, 'Food',  101.42, 6),
    (uid, 2024, 11, 'Food',  102.50, 6),
    (uid, 2024, 12, 'Food',   67.43, 6)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Mechanic (MECÁNICO)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Mechanic',   115.47, 7),
    (uid, 2024,  2, 'Mechanic',     0.00, 7),
    (uid, 2024,  3, 'Mechanic',     0.00, 7),
    (uid, 2024,  4, 'Mechanic',     0.00, 7),
    (uid, 2024,  5, 'Mechanic',     0.00, 7),
    (uid, 2024,  6, 'Mechanic',   314.00, 7),
    (uid, 2024,  7, 'Mechanic',     0.00, 7),
    (uid, 2024,  8, 'Mechanic',     0.00, 7),
    (uid, 2024,  9, 'Mechanic',  1114.00, 7),
    (uid, 2024, 10, 'Mechanic',   165.82, 7),
    (uid, 2024, 11, 'Mechanic',     0.00, 7),
    (uid, 2024, 12, 'Mechanic',     0.00, 7)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Going Out (SAÍDAS)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Going Out',  61.85, 11),
    (uid, 2024,  2, 'Going Out',   8.72, 11),
    (uid, 2024,  3, 'Going Out', 445.95, 11),
    (uid, 2024,  4, 'Going Out', 220.34, 11),
    (uid, 2024,  5, 'Going Out',  41.00, 11),
    (uid, 2024,  6, 'Going Out',  28.15, 11),
    (uid, 2024,  7, 'Going Out',  73.38, 11),
    (uid, 2024,  8, 'Going Out',  51.15, 11),
    (uid, 2024,  9, 'Going Out',  49.05, 11),
    (uid, 2024, 10, 'Going Out',   0.00, 11),
    (uid, 2024, 11, 'Going Out',  22.57, 11),
    (uid, 2024, 12, 'Going Out',  26.28, 11)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Other (OUTROS)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2024,  1, 'Other',   11.73, 12),
    (uid, 2024,  2, 'Other',  114.98, 12),
    (uid, 2024,  3, 'Other',  625.21, 12),
    (uid, 2024,  4, 'Other',  154.16, 12),
    (uid, 2024,  5, 'Other',  150.08, 12),
    (uid, 2024,  6, 'Other',  460.28, 12),
    (uid, 2024,  7, 'Other',  195.58, 12),
    (uid, 2024,  8, 'Other',  178.29, 12),
    (uid, 2024,  9, 'Other',  118.98, 12),
    (uid, 2024, 10, 'Other',  304.31, 12),
    (uid, 2024, 11, 'Other',  935.37, 12),
    (uid, 2024, 12, 'Other',  590.91, 12)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

end $$;
