-- SQL query to add consensus columns to the employee_assessments table

-- Add consensus_rating column (numeric to store decimal values)
ALTER TABLE employee_assessments ADD COLUMN consensus_rating NUMERIC;

-- Add consensus_comments column (text to store comments)
ALTER TABLE employee_assessments ADD COLUMN consensus_comments TEXT;

-- Add consensus_status column (text to store status like 'pending' or 'completed')
ALTER TABLE employee_assessments ADD COLUMN consensus_status TEXT DEFAULT 'pending';

-- Create an index on consensus_status for faster queries
CREATE INDEX idx_employee_assessments_consensus_status ON employee_assessments(consensus_status);

-- Add a comment to the table to document the changes
COMMENT ON TABLE employee_assessments IS 'Stores employee assessments including self-ratings, assessor ratings, and consensus ratings';

-- Add comments to the new columns
COMMENT ON COLUMN employee_assessments.consensus_rating IS 'Overall consensus rating (average of competency consensus ratings)';
COMMENT ON COLUMN employee_assessments.consensus_comments IS 'Overall comments for the consensus assessment';
COMMENT ON COLUMN employee_assessments.consensus_status IS 'Status of the consensus assessment (pending or completed)';

-- Update existing rows to set default values
UPDATE employee_assessments 
SET 
  consensus_status = 'pending',
  consensus_comments = ''
WHERE consensus_status IS NULL;

-- Create a function to automatically calculate consensus rating
CREATE OR REPLACE FUNCTION calculate_consensus_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- If both employee and assessor ratings exist, calculate average
  IF NEW.assessor_rating IS NOT NULL THEN
    NEW.consensus_rating = (NEW.assessor_rating + 
      (SELECT AVG(rating) FROM jsonb_to_recordset(NEW.competency_ratings) 
       AS x(rating NUMERIC))
    ) / 2;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically calculate consensus rating when assessor_rating is updated
CREATE TRIGGER auto_calculate_consensus_rating
BEFORE UPDATE OF assessor_rating ON employee_assessments
FOR EACH ROW
WHEN (OLD.assessor_rating IS DISTINCT FROM NEW.assessor_rating)
EXECUTE FUNCTION calculate_consensus_rating();

-- Instructions for running this SQL:
-- 1. Connect to your Supabase database using psql or the SQL editor in the Supabase dashboard
-- 2. Run this SQL script
-- 3. Verify the columns were added by querying the table:
--    SELECT column_name, data_type FROM information_schema.columns 
--    WHERE table_name = 'employee_assessments' AND column_name LIKE 'consensus%';
