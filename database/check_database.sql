-- 1. List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Show all columns in the employees table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 3. Check if edit_locked_until column exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'employees' AND column_name = 'edit_locked_until'
) AS edit_locked_until_exists;

-- 4. Check if user_id column exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'employees' AND column_name = 'user_id'
) AS user_id_exists;

-- 5. Check for triggers on the employees table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'employees';

-- 6. Show the first few rows of the employees table
SELECT * FROM employees LIMIT 5;
