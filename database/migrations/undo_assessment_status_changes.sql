-- First, drop the new table
DROP TABLE IF EXISTS employee_assessments;

-- Drop the new enum type
DROP TYPE IF EXISTS assessment_status;

-- Recreate the original enum type
CREATE TYPE assessment_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'reviewed'
);

-- Recreate the original table
CREATE TABLE employee_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES auth.users(id),
    employee_name TEXT,
    employee_email TEXT,
    employee_full_name TEXT,
    department_id UUID REFERENCES departments(id),
    department_name TEXT,
    job_role_id INTEGER REFERENCES job_roles(id),
    job_role_name TEXT,
    start_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status assessment_status DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    competency_ratings JSONB DEFAULT '[]'::jsonb,
    competency_data JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    assessor_id UUID REFERENCES auth.users(id),
    assessor_name TEXT,
    assessor_rating INTEGER,
    assessor_comments TEXT,
    assessor_status assessment_status DEFAULT 'pending',
    overall_rating DECIMAL(3,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate the original indexes
CREATE INDEX idx_employee_assessments_employee_id ON employee_assessments(employee_id);
CREATE INDEX idx_employee_assessments_assessor_id ON employee_assessments(assessor_id);
CREATE INDEX idx_employee_assessments_status ON employee_assessments(status);
CREATE INDEX idx_employee_assessments_assessor_status ON employee_assessments(assessor_status);
CREATE INDEX idx_employee_assessments_competency_ratings ON employee_assessments USING gin (competency_ratings);
CREATE INDEX idx_employee_assessments_competency_data ON employee_assessments USING gin (competency_data);
CREATE INDEX idx_employee_assessments_metadata ON employee_assessments USING gin (metadata); 