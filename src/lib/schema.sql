-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_user_role_assignments_updated_at ON user_role_assignments;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Create user_roles view for easier role queries
CREATE OR REPLACE VIEW user_roles AS
SELECT 
    ura.user_id,
    r.role_name
FROM user_role_assignments ura
JOIN roles r ON ura.role_id = r.id;

-- Create function to assign default role
CREATE OR REPLACE FUNCTION assign_default_role(user_id UUID)
RETURNS void AS $$
BEGIN
    -- First ensure the employee role exists
    INSERT INTO roles (role_name)
    VALUES ('employee')
    ON CONFLICT (role_name) DO NOTHING;

    -- Then assign the employee role to the user
    INSERT INTO user_role_assignments (user_id, role_id)
    SELECT 
        user_id,
        id
    FROM roles
    WHERE role_name = 'employee'
    ON CONFLICT (user_id, role_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_role_assignments_updated_at
    BEFORE UPDATE ON user_role_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles if they don't exist
INSERT INTO roles (role_name)
VALUES 
    ('hr'),
    ('assessor'),
    ('employee')
ON CONFLICT (role_name) DO NOTHING; 