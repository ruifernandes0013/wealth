-- 2025 expenses seed
-- Run in the Supabase SQL editor.

do $$
declare
  uid uuid := '7e030412-09d4-40cc-b0fb-36a7971ca5ff';
begin

  -- Mortgage (PRESTAÇÃO)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Mortgage',  428.91, 0),
    (uid, 2025,  2, 'Mortgage',  428.91, 0),
    (uid, 2025,  3, 'Mortgage',  428.91, 0),
    (uid, 2025,  4, 'Mortgage',  428.91, 0),
    (uid, 2025,  5, 'Mortgage',  797.84, 0),
    (uid, 2025,  6, 'Mortgage',  797.84, 0),
    (uid, 2025,  7, 'Mortgage',  805.70, 0),
    (uid, 2025,  8, 'Mortgage',  805.70, 0),
    (uid, 2025,  9, 'Mortgage',  805.70, 0),
    (uid, 2025, 10, 'Mortgage',  805.70, 0),
    (uid, 2025, 11, 'Mortgage',  805.70, 0),
    (uid, 2025, 12, 'Mortgage', 1432.97, 0)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Condo/Works (COND&OBRAS)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Condo/Works', 0.00, 1),
    (uid, 2025,  2, 'Condo/Works', 0.00, 1),
    (uid, 2025,  3, 'Condo/Works', 0.00, 1),
    (uid, 2025,  4, 'Condo/Works', 0.00, 1),
    (uid, 2025,  5, 'Condo/Works', 0.00, 1),
    (uid, 2025,  6, 'Condo/Works', 0.00, 1),
    (uid, 2025,  7, 'Condo/Works', 0.00, 1),
    (uid, 2025,  8, 'Condo/Works', 0.00, 1),
    (uid, 2025,  9, 'Condo/Works', 0.00, 1),
    (uid, 2025, 10, 'Condo/Works', 0.00, 1),
    (uid, 2025, 11, 'Condo/Works', 0.00, 1),
    (uid, 2025, 12, 'Condo/Works', 0.00, 1)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Diesel (GÁSOLEO)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Diesel', 153.63, 5),
    (uid, 2025,  2, 'Diesel', 165.29, 5),
    (uid, 2025,  3, 'Diesel', 202.81, 5),
    (uid, 2025,  4, 'Diesel', 187.18, 5),
    (uid, 2025,  5, 'Diesel', 147.12, 5),
    (uid, 2025,  6, 'Diesel', 218.20, 5),
    (uid, 2025,  7, 'Diesel', 239.15, 5),
    (uid, 2025,  8, 'Diesel', 222.58, 5),
    (uid, 2025,  9, 'Diesel', 176.43, 5),
    (uid, 2025, 10, 'Diesel', 188.66, 5),
    (uid, 2025, 11, 'Diesel', 176.50, 5),
    (uid, 2025, 12, 'Diesel', 144.10, 5)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Food (ALIMENTAÇÃO & CASA)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Food',  209.87, 6),
    (uid, 2025,  2, 'Food',   48.73, 6),
    (uid, 2025,  3, 'Food',  255.49, 6),
    (uid, 2025,  4, 'Food',  297.45, 6),
    (uid, 2025,  5, 'Food',  385.32, 6),
    (uid, 2025,  6, 'Food',  542.73, 6),
    (uid, 2025,  7, 'Food',  559.09, 6),
    (uid, 2025,  8, 'Food',  720.59, 6),
    (uid, 2025,  9, 'Food',  547.39, 6),
    (uid, 2025, 10, 'Food',  500.00, 6),
    (uid, 2025, 11, 'Food',  516.90, 6),
    (uid, 2025, 12, 'Food',  400.00, 6)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Mechanic (MECÁNICO)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Mechanic',   0.00, 7),
    (uid, 2025,  2, 'Mechanic',   0.00, 7),
    (uid, 2025,  3, 'Mechanic',   0.00, 7),
    (uid, 2025,  4, 'Mechanic',   0.00, 7),
    (uid, 2025,  5, 'Mechanic',   0.00, 7),
    (uid, 2025,  6, 'Mechanic',   0.00, 7),
    (uid, 2025,  7, 'Mechanic',   0.00, 7),
    (uid, 2025,  8, 'Mechanic',   0.00, 7),
    (uid, 2025,  9, 'Mechanic', 194.65, 7),
    (uid, 2025, 10, 'Mechanic',   4.00, 7),
    (uid, 2025, 11, 'Mechanic',   0.00, 7),
    (uid, 2025, 12, 'Mechanic',   0.00, 7)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Going Out (SAÍDAS)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Going Out',  44.30, 11),
    (uid, 2025,  2, 'Going Out',  83.25, 11),
    (uid, 2025,  3, 'Going Out',  39.80, 11),
    (uid, 2025,  4, 'Going Out',  67.88, 11),
    (uid, 2025,  5, 'Going Out',  12.55, 11),
    (uid, 2025,  6, 'Going Out', 122.55, 11),
    (uid, 2025,  7, 'Going Out',  63.60, 11),
    (uid, 2025,  8, 'Going Out',  75.55, 11),
    (uid, 2025,  9, 'Going Out', 206.94, 11),
    (uid, 2025, 10, 'Going Out',  47.65, 11),
    (uid, 2025, 11, 'Going Out', 195.49, 11),
    (uid, 2025, 12, 'Going Out', 207.38, 11)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

  -- Other (OUTROS)
  insert into expenses (user_id, year, month, name, amount, sort_order)
  values
    (uid, 2025,  1, 'Other',  567.14, 12),
    (uid, 2025,  2, 'Other',  307.54, 12),
    (uid, 2025,  3, 'Other',  249.94, 12),
    (uid, 2025,  4, 'Other', 1221.87, 12),
    (uid, 2025,  5, 'Other',  450.88, 12),
    (uid, 2025,  6, 'Other',  470.74, 12),
    (uid, 2025,  7, 'Other',  477.37, 12),
    (uid, 2025,  8, 'Other',  305.04, 12),
    (uid, 2025,  9, 'Other',  407.68, 12),
    (uid, 2025, 10, 'Other',  373.14, 12),
    (uid, 2025, 11, 'Other', 1584.49, 12),
    (uid, 2025, 12, 'Other', 1274.61, 12)
  on conflict (user_id, year, month, name) do update set amount = excluded.amount;

end $$;
