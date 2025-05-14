ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Create roles enum
CREATE TYPE user_role AS ENUM ('employee', 'assessor', 'hr');

-- Create assessment status enum
CREATE TYPE assessment_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name user_role NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_name)
);

-- Insert default roles
INSERT INTO roles (role_name, description) VALUES
  ('employee', 'Regular employee with limited access'),
  ('assessor', 'Can assess and edit employee profiles'),
  ('hr', 'HR staff with full access to all features')
ON CONFLICT (role_name) DO NOTHING;

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_number VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_edited_by UUID REFERENCES auth.users(id),
  edit_locked_until TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Create employee_departments junction table
CREATE TABLE IF NOT EXISTS employee_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, department_id)
);

-- Create employee_assessments table
CREATE TABLE IF NOT EXISTS employee_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL,
  status assessment_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a view to get user roles easily
CREATE OR REPLACE VIEW user_roles AS
  SELECT 
    u.id as user_id,
    u.email,
    r.role_name
  FROM auth.users u
  JOIN user_role_assignments ura ON u.id = ura.user_id
  JOIN roles r ON ura.role_id = r.id;

-- Create a function to assign default role to new users
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_role_assignments (user_id, role_id)
  SELECT NEW.id, id FROM roles WHERE role_name = 'employee';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to assign default role to new users
CREATE TRIGGER assign_default_role_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION assign_default_role();

-- Create a function to update employee edit lock time
CREATE OR REPLACE FUNCTION update_employee_edit_lock()
RETURNS TRIGGER AS $$
BEGIN
  -- Set edit lock for 24 hours after update
  NEW.edit_locked_until = NOW() + INTERVAL '24 hours';
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update employee edit lock time
CREATE TRIGGER update_employee_edit_lock_trigger
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_employee_edit_lock();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_assessments ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY roles_select_policy ON roles FOR SELECT USING (true);
CREATE POLICY roles_insert_policy ON roles FOR INSERT WITH CHECK (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');
CREATE POLICY roles_update_policy ON roles FOR UPDATE USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');
CREATE POLICY roles_delete_policy ON roles FOR DELETE USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');

-- User role assignments policies
CREATE POLICY user_role_assignments_select_policy ON user_role_assignments FOR SELECT USING (true);
CREATE POLICY user_role_assignments_insert_policy ON user_role_assignments FOR INSERT WITH CHECK (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');
CREATE POLICY user_role_assignments_update_policy ON user_role_assignments FOR UPDATE USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');
CREATE POLICY user_role_assignments_delete_policy ON user_role_assignments FOR DELETE USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');

-- Employees policies
-- Everyone can view employees
CREATE POLICY employees_select_policy ON employees FOR SELECT USING (true);

-- Only HR can insert new employees
CREATE POLICY employees_insert_policy ON employees FOR INSERT WITH CHECK (
  auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr'
);

-- Employees can update their own profile, assessors and HR can update any profile
CREATE POLICY employees_update_policy ON employees FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    JOIN roles r ON ura.role_id = r.id 
    WHERE ura.user_id = auth.uid() AND (r.role_name = 'assessor' OR r.role_name = 'hr')
  )
);

-- Only HR can delete employees
CREATE POLICY employees_delete_policy ON employees FOR DELETE USING (
  auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr'
);

-- Departments policies
CREATE POLICY departments_select_policy ON departments FOR SELECT USING (true);
CREATE POLICY departments_insert_policy ON departments FOR INSERT WITH CHECK (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');
CREATE POLICY departments_update_policy ON departments FOR UPDATE USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');
CREATE POLICY departments_delete_policy ON departments FOR DELETE USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr');

-- Employee departments policies
CREATE POLICY employee_departments_select_policy ON employee_departments FOR SELECT USING (true);
CREATE POLICY employee_departments_insert_policy ON employee_departments FOR INSERT WITH CHECK (
  auth.jwt() ? 'role' AND (auth.jwt()->>'role' = 'hr' OR auth.jwt()->>'role' = 'assessor')
);
CREATE POLICY employee_departments_update_policy ON employee_departments FOR UPDATE USING (
  auth.jwt() ? 'role' AND (auth.jwt()->>'role' = 'hr' OR auth.jwt()->>'role' = 'assessor')
);
CREATE POLICY employee_departments_delete_policy ON employee_departments FOR DELETE USING (
  auth.jwt() ? 'role' AND (auth.jwt()->>'role' = 'hr' OR auth.jwt()->>'role' = 'assessor')
);

-- Employee assessments policies
CREATE POLICY employee_assessments_select_policy ON employee_assessments FOR SELECT USING (true);
CREATE POLICY employee_assessments_insert_policy ON employee_assessments FOR INSERT WITH CHECK (
  auth.jwt() ? 'role' AND (auth.jwt()->>'role' = 'hr' OR auth.jwt()->>'role' = 'assessor')
);
CREATE POLICY employee_assessments_update_policy ON employee_assessments FOR UPDATE USING (
  auth.jwt() ? 'role' AND (auth.jwt()->>'role' = 'hr' OR auth.jwt()->>'role' = 'assessor')
);
CREATE POLICY employee_assessments_delete_policy ON employee_assessments FOR DELETE USING (
  auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'hr'
);
