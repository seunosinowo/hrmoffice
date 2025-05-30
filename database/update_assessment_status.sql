-- First, create a new enum type with the correct case
CREATE TYPE assessment_status_new AS ENUM ('Pending', 'In_Progress', 'Completed', 'Template');

-- Remove the default value first
ALTER TABLE public.employee_assessments 
  ALTER COLUMN status DROP DEFAULT;

-- Update the column to use the new enum type, handling the case conversion
ALTER TABLE public.employee_assessments 
  ALTER COLUMN status TYPE assessment_status_new 
  USING CASE 
    WHEN status::text = 'pending' THEN 'Pending'::assessment_status_new
    WHEN status::text = 'in_progress' THEN 'In_Progress'::assessment_status_new
    WHEN status::text = 'completed' THEN 'Completed'::assessment_status_new
    WHEN status::text = 'template' THEN 'Template'::assessment_status_new
    ELSE 'Pending'::assessment_status_new
  END;

-- Drop the old enum type
DROP TYPE assessment_status;

-- Rename the new enum type to the original name
ALTER TYPE assessment_status_new RENAME TO assessment_status;

-- Add the default value back with the new type
ALTER TABLE public.employee_assessments 
  ALTER COLUMN status SET DEFAULT 'Pending'::assessment_status; 