-- Run in Supabase SQL Editor to see which table(s) have a gender column.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name = 'gender'
  AND table_schema = 'public'
ORDER BY table_name;
