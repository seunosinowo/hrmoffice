-- EMPLOYEE DETAILS SETUP QUERY
-- This query will:
-- 1. Check and configure the employee_pictures storage bucket
-- 2. Set up proper RLS policies for the bucket
-- 3. Ensure the employees table has the necessary columns

-- PART 1: STORAGE BUCKET SETUP
-- First, check if the employee_pictures bucket exists
SELECT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'employee_pictures'
) AS bucket_exists;

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public)
SELECT 'employee_pictures', 'employee_pictures', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'employee_pictures'
);

-- PART 2: STORAGE BUCKET POLICIES
-- For Supabase, we need to use the Storage Management API instead of direct SQL
-- These operations should be performed through the Supabase Dashboard:

-- 1. Go to Storage in the left sidebar
-- 2. Click on the 'employee_pictures' bucket
-- 3. Go to the "Policies" tab
-- 4. Click "Add Policy" and create the following policies:
--    - For public read access: Select "SELECT" as the action, and set it to allow everyone
--    - For uploads: Select "INSERT" as the action, and set it to allow authenticated users
--    - For updates: Select "UPDATE" as the action, and set it to allow authenticated users
--    - For deletes: Select "DELETE" as the action, and set it to allow authenticated users

-- Since we can't directly manipulate policies via SQL in your Supabase instance,
-- we'll skip this section and focus on the table structure.

-- PART 3: EMPLOYEES TABLE SETUP
-- Check if the edit_locked_until column exists in the employees table
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'employees'
  AND column_name = 'edit_locked_until'
) AS edit_locked_column_exists;

-- Add the edit_locked_until column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'employees'
    AND column_name = 'edit_locked_until'
  ) THEN
    ALTER TABLE employees
    ADD COLUMN edit_locked_until TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- Check if the profile_picture_url column exists in the employees table
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'employees'
  AND column_name = 'profile_picture_url'
) AS profile_picture_column_exists;

-- Add the profile_picture_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'employees'
    AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE employees
    ADD COLUMN profile_picture_url TEXT DEFAULT NULL;
  END IF;
END $$;

-- Check if the last_edited_by column exists in the employees table
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'employees'
  AND column_name = 'last_edited_by'
) AS last_edited_by_column_exists;

-- Add the last_edited_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'employees'
    AND column_name = 'last_edited_by'
  ) THEN
    ALTER TABLE employees
    ADD COLUMN last_edited_by UUID DEFAULT NULL
    REFERENCES auth.users(id);
  END IF;
END $$;

-- PART 4: CREATE TRIGGER FOR EDIT LOCKING
-- Create a function to update the edit_locked_until timestamp
CREATE OR REPLACE FUNCTION set_edit_locked_until()
RETURNS TRIGGER AS $$
BEGIN
  -- Set edit_locked_until to 12 hours from now
  -- Only for employee role (not for assessor or HR)
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'employee'
  ) THEN
    NEW.edit_locked_until = NOW() + INTERVAL '12 hours';
  END IF;

  -- Always record who made the edit
  NEW.last_edited_by = auth.uid();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_employee_edit_locked_until ON employees;

-- Create the trigger
CREATE TRIGGER set_employee_edit_locked_until
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION set_edit_locked_until();

-- PART 5: VERIFY SETUP
-- Check the bucket status
SELECT 'BUCKET STATUS' as check_type, b.name as bucket_name, b.public as is_public
FROM storage.buckets b
WHERE b.name = 'employee_pictures';

-- Check the employees table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM
  information_schema.columns
WHERE
  table_name = 'employees'
ORDER BY
  ordinal_position;
