-- Check if employee_id column exists in employee_job_assignments table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'employee_job_assignments'
        AND column_name = 'employee_id'
    ) THEN
        -- Add employee_id column to reference employees table
        ALTER TABLE employee_job_assignments ADD COLUMN employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;
        
        COMMENT ON COLUMN employee_job_assignments.employee_id IS 'Reference to the employees table to link job assignments with employee profiles';
        
        RAISE NOTICE 'Added employee_id column to employee_job_assignments table';
    ELSE
        RAISE NOTICE 'employee_id column already exists in employee_job_assignments table';
    END IF;
END $$;

-- Check if user_id column exists in employee_job_assignments table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'employee_job_assignments'
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column to reference auth.users table
        ALTER TABLE employee_job_assignments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        COMMENT ON COLUMN employee_job_assignments.user_id IS 'Reference to the auth.users table to link job assignments with user accounts';
        
        RAISE NOTICE 'Added user_id column to employee_job_assignments table';
    ELSE
        RAISE NOTICE 'user_id column already exists in employee_job_assignments table';
    END IF;
END $$;

-- Create or update RLS policies for employee_job_assignments
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS employee_job_assignments_select_policy ON employee_job_assignments;
    DROP POLICY IF EXISTS employee_job_assignments_insert_policy ON employee_job_assignments;
    DROP POLICY IF EXISTS employee_job_assignments_update_policy ON employee_job_assignments;
    DROP POLICY IF EXISTS employee_job_assignments_delete_policy ON employee_job_assignments;
    
    -- Enable RLS on the table
    ALTER TABLE employee_job_assignments ENABLE ROW LEVEL SECURITY;
    
    -- Create new policies
    
    -- Everyone can view job assignments, but employees can only see their own
    CREATE POLICY employee_job_assignments_select_policy ON employee_job_assignments 
    FOR SELECT USING (
        -- HR and assessors can see all assignments
        EXISTS (
            SELECT 1 FROM user_role_assignments ura 
            JOIN roles r ON ura.role_id = r.id 
            WHERE ura.user_id = auth.uid() AND (r.role_name = 'assessor' OR r.role_name = 'hr')
        )
        OR
        -- Employees can only see their own assignments
        (
            EXISTS (
                SELECT 1 FROM user_role_assignments ura 
                JOIN roles r ON ura.role_id = r.id 
                WHERE ura.user_id = auth.uid() AND r.role_name = 'employee'
            )
            AND
            user_id = auth.uid()
        )
    );
    
    -- Only HR can insert new job assignments
    CREATE POLICY employee_job_assignments_insert_policy ON employee_job_assignments 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura 
            JOIN roles r ON ura.role_id = r.id 
            WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
        )
    );
    
    -- Only HR can update job assignments
    CREATE POLICY employee_job_assignments_update_policy ON employee_job_assignments 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura 
            JOIN roles r ON ura.role_id = r.id 
            WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
        )
    );
    
    -- Only HR can delete job assignments
    CREATE POLICY employee_job_assignments_delete_policy ON employee_job_assignments 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura 
            JOIN roles r ON ura.role_id = r.id 
            WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
        )
    );
    
    RAISE NOTICE 'Created RLS policies for employee_job_assignments table';
END $$;
