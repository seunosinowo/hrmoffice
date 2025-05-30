-- Add metadata column to employee_assessments table
ALTER TABLE employee_assessments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN employee_assessments.metadata IS 'Stores additional metadata for the assessment';

-- Create an index on the metadata column for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_assessments_metadata 
ON employee_assessments USING gin (metadata); 