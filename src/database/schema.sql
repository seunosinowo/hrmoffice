CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('employee', 'assessor', 'hr')),
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Table to track which assessors are assigned to which employees
CREATE TABLE assessor_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessor_id, employee_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_assessor_assignments_assessor_id ON assessor_assignments(assessor_id);
CREATE INDEX idx_assessor_assignments_employee_id ON assessor_assignments(employee_id);

-- Insert default roles with permissions
INSERT INTO roles (name, description, permissions) VALUES
('employee', 'Regular employee with limited access', '["view:own_profile", "edit:own_profile", "view:own_assessments", "edit:own_assessments", "view:competencies", "view:job_roles", "view:departments", "view:gaps"]'),
('assessor', 'Can assess assigned employees', '["view:own_profile", "edit:own_profile", "view:own_assessments", "edit:own_assessments", "view:competencies", "view:job_roles", "view:departments", "view:gaps", "view:employee_details", "view:assigned_assessments", "create:assessments", "edit:assigned_assessments", "view:reports", "view:assigned_users"]'),
('hr', 'Human resources with extended permissions', '["view:own_profile", "edit:own_profile", "view:own_assessments", "edit:own_assessments", "view:competencies", "view:job_roles", "view:departments", "view:gaps", "view:employee_details", "view:assigned_assessments", "create:assessments", "edit:assigned_assessments", "view:reports", "view:all_employees", "edit:employees", "view:all_assessments", "edit:assessments", "edit:competencies", "edit:job_roles", "edit:departments", "manage:users", "manage:roles"]');
