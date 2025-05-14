-- SQL to set up the assessors table and related policies

-- Create the assessors table if it doesn't exist
CREATE TABLE IF NOT EXISTS assessors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create RLS policies for the assessors table
ALTER TABLE assessors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "All authenticated users can view assessors" ON assessors;
DROP POLICY IF EXISTS "HR users can manage assessors" ON assessors;

-- Create a policy that allows all authenticated users to view assessors
CREATE POLICY "All authenticated users can view assessors" 
ON assessors
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create a policy that allows HR users to manage assessors
CREATE POLICY "HR users can manage assessors" 
ON assessors
FOR ALL
USING (auth.role() = 'authenticated');

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for the assessors table
DROP TRIGGER IF EXISTS update_assessors_updated_at ON assessors;
CREATE TRIGGER update_assessors_updated_at
BEFORE UPDATE ON assessors
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessors_user_id ON assessors(user_id);
CREATE INDEX IF NOT EXISTS idx_assessors_employee_id ON assessors(employee_id);

-- Instructions for use:
-- 1. Run this SQL in the Supabase SQL Editor
-- 2. The "Add Assessor" button in the AssessorsTab will add all users with the assessor role to this table
-- 3. The EmployeeAssessorAssign component will use this table to select assessors
