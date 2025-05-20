-- Fix employee_assessments table by adding all necessary columns
-- Run this in the Supabase SQL Editor

-- Add employee_full_name column if it doesn't exist
ALTER TABLE employee_assessments 
ADD COLUMN IF NOT EXISTS employee_full_name VARCHAR(200);

-- Add job_role_id column if it doesn't exist
ALTER TABLE employee_assessments 
ADD COLUMN IF NOT EXISTS job_role_id UUID;

-- Add job_role_name column if it doesn't exist
ALTER TABLE employee_assessments 
ADD COLUMN IF NOT EXISTS job_role_name VARCHAR(100);

-- Add comments to explain the columns
COMMENT ON COLUMN employee_assessments.employee_full_name IS 'Full name of the employee for display purposes';
COMMENT ON COLUMN employee_assessments.job_role_id IS 'Reference to the job_roles table';
COMMENT ON COLUMN employee_assessments.job_role_name IS 'Name of the job role for display purposes';
