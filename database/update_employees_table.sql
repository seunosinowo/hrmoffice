DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'employees'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE employees ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        COMMENT ON COLUMN employees.user_id IS 'Reference to the auth.users table to link employees with their user accounts';
        
        RAISE NOTICE 'Added user_id column to employees table';
    ELSE
        RAISE NOTICE 'user_id column already exists in employees table';
    END IF;
END $$;

-- Check if edit_locked_until column exists in employees table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'employees'
        AND column_name = 'edit_locked_until'
    ) THEN
        ALTER TABLE employees ADD COLUMN edit_locked_until TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        COMMENT ON COLUMN employees.edit_locked_until IS 'Timestamp until which the employee profile is locked for editing';
        
        RAISE NOTICE 'Added edit_locked_until column to employees table';
    ELSE
        RAISE NOTICE 'edit_locked_until column already exists in employees table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'update_employee_edit_lock'
    ) THEN
        -- Create the function
        CREATE OR REPLACE FUNCTION update_employee_edit_lock()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Set edit lock for 24 hours after update
          NEW.edit_locked_until = NOW() + INTERVAL '24 hours';
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        RAISE NOTICE 'Created update_employee_edit_lock function';
    ELSE
        RAISE NOTICE 'update_employee_edit_lock function already exists';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_employee_edit_lock_trigger'
    ) THEN
        CREATE TRIGGER update_employee_edit_lock_trigger
        BEFORE UPDATE ON employees
        FOR EACH ROW
        EXECUTE FUNCTION update_employee_edit_lock();
        
        RAISE NOTICE 'Created update_employee_edit_lock_trigger';
    ELSE
        RAISE NOTICE 'update_employee_edit_lock_trigger already exists';
    END IF;
END $$;
