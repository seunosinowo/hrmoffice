-- Create enum types
CREATE TYPE assessment_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'reviewed'
);

-- Create employee_assessments table
CREATE TABLE IF NOT EXISTS employee_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    employee_email TEXT,
    employee_full_name TEXT,
    department_id UUID,
    department_name TEXT,
    job_role_id UUID,
    job_role_name TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status assessment_status DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    competency_ratings JSONB DEFAULT '[]'::jsonb,
    assessor_id UUID,
    assessor_name TEXT,
    assessor_rating INTEGER,
    assessor_comments TEXT,
    assessor_status assessment_status DEFAULT 'pending',
    overall_rating DECIMAL(3,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on employee_id
CREATE INDEX IF NOT EXISTS idx_employee_assessments_employee_id ON employee_assessments(employee_id);

-- Create index on assessor_id
CREATE INDEX IF NOT EXISTS idx_employee_assessments_assessor_id ON employee_assessments(assessor_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_employee_assessments_status ON employee_assessments(status);

-- Create index on assessor_status
CREATE INDEX IF NOT EXISTS idx_employee_assessments_assessor_status ON employee_assessments(assessor_status); 