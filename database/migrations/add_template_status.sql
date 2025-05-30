-- Add 'template' and 'Reviewed' to the assessment_status enum
ALTER TYPE assessment_status ADD VALUE IF NOT EXISTS 'template';
ALTER TYPE assessment_status ADD VALUE IF NOT EXISTS 'Reviewed';

-- Commit the transaction to make the new enum values available
COMMIT;

-- Update any existing 'template' values to 'pending' to ensure data consistency
UPDATE employee_assessments 
SET status = 'pending' 
WHERE status = 'template';

UPDATE employee_assessments 
SET assessor_status = 'pending' 
WHERE assessor_status = 'template'; 