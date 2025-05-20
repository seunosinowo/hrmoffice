-- Fix RLS policies for employee_assessments table
-- Run this in the Supabase SQL Editor

-- First, check if the table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_assessments') THEN
    RAISE EXCEPTION 'Table employee_assessments does not exist';
  END IF;
END $$;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS employees_can_insert_own_assessments ON employee_assessments;
DROP POLICY IF EXISTS employees_can_update_own_assessments ON employee_assessments;
DROP POLICY IF EXISTS employees_can_read_own_assessments ON employee_assessments;
DROP POLICY IF EXISTS assessors_can_update_assessments ON employee_assessments;
DROP POLICY IF EXISTS assessors_can_read_all_assessments ON employee_assessments;
DROP POLICY IF EXISTS assessors_can_delete_assessments ON employee_assessments;

-- Create a function to check if a user is an employee
CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_role_assignments
        WHERE user_id = auth.uid() AND role = 'employee'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is an assessor or HR
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

-- Create policy to allow employees to insert their own assessments
CREATE POLICY employees_can_insert_own_assessments ON employee_assessments
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL -- Allow any authenticated user to insert
);

-- Create policy to allow employees to update their own assessments
CREATE POLICY employees_can_update_own_assessments ON employee_assessments
FOR UPDATE
USING (employee_id = auth.uid())
WITH CHECK (employee_id = auth.uid());

-- Create policy to allow employees to read their own assessments
CREATE POLICY employees_can_read_own_assessments ON employee_assessments
FOR SELECT
USING (employee_id = auth.uid());

-- Create policy to allow assessors and HR to update assessments
CREATE POLICY assessors_can_update_assessments ON employee_assessments
FOR UPDATE
USING (is_assessor_or_hr())
WITH CHECK (is_assessor_or_hr());

-- Create policy to allow assessors and HR to read all assessments
CREATE POLICY assessors_can_read_all_assessments ON employee_assessments
FOR SELECT
USING (is_assessor_or_hr());

-- Create policy to allow assessors and HR to delete assessments
CREATE POLICY assessors_can_delete_assessments ON employee_assessments
FOR DELETE
USING (is_assessor_or_hr());

-- Make sure RLS is enabled on the table
ALTER TABLE employee_assessments ENABLE ROW LEVEL SECURITY;

-- Add a comment to the table
COMMENT ON TABLE employee_assessments IS 'Stores employee self-assessments and assessor ratings';

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated RLS policies for employee_assessments table';
END $$;
