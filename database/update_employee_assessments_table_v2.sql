-- Update employee_assessments table to add employee_full_name column
DO $$
BEGIN
    -- Add employee_full_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'employee_assessments'
        AND column_name = 'employee_full_name'
    ) THEN
        ALTER TABLE employee_assessments ADD COLUMN employee_full_name VARCHAR(200);
        COMMENT ON COLUMN employee_assessments.employee_full_name IS 'Full name of the employee for display purposes';
        RAISE NOTICE 'Added employee_full_name column to employee_assessments table';
    ELSE
        RAISE NOTICE 'employee_full_name column already exists in employee_assessments table';
    END IF;

    -- Add job_role_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'employee_assessments'
        AND column_name = 'job_role_id'
    ) THEN
        ALTER TABLE employee_assessments ADD COLUMN job_role_id UUID;
        COMMENT ON COLUMN employee_assessments.job_role_id IS 'Reference to the job_roles table';
        RAISE NOTICE 'Added job_role_id column to employee_assessments table';
    ELSE
        RAISE NOTICE 'job_role_id column already exists in employee_assessments table';
    END IF;

    -- Add job_role_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'employee_assessments'
        AND column_name = 'job_role_name'
    ) THEN
        ALTER TABLE employee_assessments ADD COLUMN job_role_name VARCHAR(100);
        COMMENT ON COLUMN employee_assessments.job_role_name IS 'Name of the job role for display purposes';
        RAISE NOTICE 'Added job_role_name column to employee_assessments table';
    ELSE
        RAISE NOTICE 'job_role_name column already exists in employee_assessments table';
    END IF;
END $$;
