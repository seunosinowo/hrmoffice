-- Add competency_data column to employee_assessments table
ALTER TABLE employee_assessments
ADD COLUMN IF NOT EXISTS competency_data JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN employee_assessments.competency_data IS 'Stores the competency assessment data in JSON format';

-- Create an index on the competency_data column for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_assessments_competency_data 
ON employee_assessments USING gin (competency_data); 