-- First, let's create the assessment_status enum type
DO $$ 
BEGIN
    -- Drop existing enum type if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'assessment_status'
    ) THEN
        DROP TYPE assessment_status CASCADE;
    END IF;

    -- Create new enum type with consistent lowercase values
    CREATE TYPE assessment_status AS ENUM (
        'not_started',
        'in_progress',
        'completed',
        'reviewed',
        'template'
    );
END $$;

-- Now let's ensure the employee_assessments table has all required columns
DO $$ 
BEGIN
    -- Add employee_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN employee_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add employee_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'employee_name'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN employee_name TEXT;
    END IF;

    -- Add employee_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'employee_email'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN employee_email TEXT;
    END IF;

    -- Add employee_full_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'employee_full_name'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN employee_full_name TEXT;
    END IF;

    -- Add department_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;

    -- Add department_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'department_name'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN department_name TEXT;
    END IF;

    -- Add job_role_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'job_role_id'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN job_role_id UUID REFERENCES public.job_roles(id);
    END IF;

    -- Add job_role_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'job_role_name'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN job_role_name TEXT;
    END IF;

    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
    END IF;

    -- Add last_updated column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN last_updated DATE DEFAULT CURRENT_DATE;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN status assessment_status DEFAULT 'not_started';
    END IF;

    -- Add progress column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'progress'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN progress INTEGER DEFAULT 0;
    END IF;

    -- Add competency_ratings column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'competency_ratings'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN competency_ratings JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add competency_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'competency_data'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN competency_data JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add assessor_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'assessor_id'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN assessor_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add assessor_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'assessor_name'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN assessor_name TEXT;
    END IF;

    -- Add assessor_rating column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'assessor_rating'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN assessor_rating INTEGER;
    END IF;

    -- Add assessor_comments column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'assessor_comments'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN assessor_comments TEXT;
    END IF;

    -- Add assessor_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'assessor_status'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN assessor_status TEXT DEFAULT 'pending';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'employee_assessments' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.employee_assessments 
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_assessments_employee_id 
ON public.employee_assessments(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_assessments_department_id 
ON public.employee_assessments(department_id);

CREATE INDEX IF NOT EXISTS idx_employee_assessments_job_role_id 
ON public.employee_assessments(job_role_id);

CREATE INDEX IF NOT EXISTS idx_employee_assessments_status 
ON public.employee_assessments(status);

CREATE INDEX IF NOT EXISTS idx_employee_assessments_competency_ratings 
ON public.employee_assessments USING gin (competency_ratings);

CREATE INDEX IF NOT EXISTS idx_employee_assessments_competency_data 
ON public.employee_assessments USING gin (competency_data);

CREATE INDEX IF NOT EXISTS idx_employee_assessments_assessor_id 
ON public.employee_assessments(assessor_id);

-- Ensure RLS is enabled
ALTER TABLE public.employee_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all authenticated users to view assessments" ON public.employee_assessments;
DROP POLICY IF EXISTS "Allow HR and assessors to insert assessments" ON public.employee_assessments;
DROP POLICY IF EXISTS "Allow HR and assessors to update assessments" ON public.employee_assessments;
DROP POLICY IF EXISTS "Allow HR to delete assessments" ON public.employee_assessments;

-- Create new policies
CREATE POLICY "Allow all authenticated users to view assessments"
ON public.employee_assessments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow HR and assessors to insert assessments"
ON public.employee_assessments FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON ura.role_id = r.id
        WHERE ura.user_id = auth.uid()
        AND r.role_name IN ('hr', 'assessor')
    )
);

CREATE POLICY "Allow HR and assessors to update assessments"
ON public.employee_assessments FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON ura.role_id = r.id
        WHERE ura.user_id = auth.uid()
        AND r.role_name IN ('hr', 'assessor')
    )
);

CREATE POLICY "Allow HR to delete assessments"
ON public.employee_assessments FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON ura.role_id = r.id
        WHERE ura.user_id = auth.uid()
        AND r.role_name = 'hr'
    )
); 