-- Add competency_data column to employee_assessments table
ALTER TABLE public.employee_assessments
ADD COLUMN competency_data JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.employee_assessments.competency_data IS 'Stores the competency assessment data in JSON format';

-- Create an index on the competency_data column for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_assessments_competency_data 
ON public.employee_assessments USING gin (competency_data);

-- Update the updated_at trigger to handle the new column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set
DROP TRIGGER IF EXISTS set_updated_at ON public.employee_assessments;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.employee_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 