-- Direct ALTER TABLE command to add edit_locked_until column
-- This is a simpler approach that should work in all PostgreSQL versions
ALTER TABLE employees ADD COLUMN IF NOT EXISTS edit_locked_until TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Direct ALTER TABLE command to add user_id column if needed
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create or replace the function to update employee edit lock time
CREATE OR REPLACE FUNCTION update_employee_edit_lock()
RETURNS TRIGGER AS $$
BEGIN
  -- Set edit lock for 24 hours after update
  NEW.edit_locked_until = NOW() + INTERVAL '24 hours';
  -- Check if updated_at column exists before trying to update it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid errors when recreating
DROP TRIGGER IF EXISTS update_employee_edit_lock_trigger ON employees;

-- Create the trigger
CREATE TRIGGER update_employee_edit_lock_trigger
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_employee_edit_lock();
