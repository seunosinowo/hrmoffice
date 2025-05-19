-- Update employee_assessments table to support assessor ratings

-- Check if assessor_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employee_assessments' AND column_name = 'assessor_id') THEN
        ALTER TABLE employee_assessments ADD COLUMN assessor_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Check if assessor_name column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employee_assessments' AND column_name = 'assessor_name') THEN
        ALTER TABLE employee_assessments ADD COLUMN assessor_name TEXT;
    END IF;
END $$;

-- Check if assessor_rating column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employee_assessments' AND column_name = 'assessor_rating') THEN
        ALTER TABLE employee_assessments ADD COLUMN assessor_rating NUMERIC(3,1);
    END IF;
END $$;

-- Check if assessor_comments column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employee_assessments' AND column_name = 'assessor_comments') THEN
        ALTER TABLE employee_assessments ADD COLUMN assessor_comments TEXT;
    END IF;
END $$;

-- Check if assessor_status column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employee_assessments' AND column_name = 'assessor_status') THEN
        ALTER TABLE employee_assessments ADD COLUMN assessor_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Update RLS policies to allow assessors and HR to update assessments

-- First, create a function to check if a user is an assessor or HR
CREATE OR REPLACE FUNCTION public.is_assessor_or_hr()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the highest role for the current user
    SELECT role INTO user_role FROM (
        SELECT 'hr' as role, 1 as priority
        UNION ALL
        SELECT 'assessor' as role, 2 as priority
        UNION ALL
        SELECT 'employee' as role, 3 as priority
    ) roles
    WHERE roles.role IN (
        SELECT role FROM user_role_assignments
        WHERE user_id = auth.uid()
    )
    ORDER BY priority
    LIMIT 1;
    
    -- Return true if the user is an assessor or HR
    RETURN user_role IN ('assessor', 'hr');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy to allow assessors and HR to update assessments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employee_assessments' AND policyname = 'assessors_can_update_assessments'
    ) THEN
        CREATE POLICY assessors_can_update_assessments ON employee_assessments
        FOR UPDATE
        USING (is_assessor_or_hr())
        WITH CHECK (is_assessor_or_hr());
    END IF;
END $$;

-- Create policy to allow assessors and HR to read all assessments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employee_assessments' AND policyname = 'assessors_can_read_all_assessments'
    ) THEN
        CREATE POLICY assessors_can_read_all_assessments ON employee_assessments
        FOR SELECT
        USING (is_assessor_or_hr());
    END IF;
END $$;

-- Create policy to allow assessors and HR to delete assessments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employee_assessments' AND policyname = 'assessors_can_delete_assessments'
    ) THEN
        CREATE POLICY assessors_can_delete_assessments ON employee_assessments
        FOR DELETE
        USING (is_assessor_or_hr());
    END IF;
END $$;

-- Make sure RLS is enabled on the table
ALTER TABLE employee_assessments ENABLE ROW LEVEL SECURITY;

-- Add a comment to the table
COMMENT ON TABLE employee_assessments IS 'Stores employee self-assessments and assessor ratings';
