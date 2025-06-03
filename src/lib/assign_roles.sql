-- Drop existing functions first
DROP FUNCTION IF EXISTS assign_role_from_status(UUID);
DROP FUNCTION IF EXISTS sync_user_email_status();
DROP FUNCTION IF EXISTS update_user_email_status();

-- Function to assign role based on user_email_status
CREATE OR REPLACE FUNCTION assign_role_from_status_new(p_user_id UUID)
RETURNS void AS $$
DECLARE
    user_role TEXT;
    role_id UUID;
BEGIN
    -- Get the role from user_email_status
    SELECT role_name INTO user_role
    FROM user_email_status
    WHERE user_id = p_user_id;

    -- If role exists in user_email_status, assign it
    IF user_role IS NOT NULL THEN
        -- Get the role_id
        SELECT id INTO role_id
        FROM roles
        WHERE role_name = user_role;

        -- If role exists, create the assignment
        IF role_id IS NOT NULL THEN
            INSERT INTO user_role_assignments (user_id, role_id)
            VALUES (p_user_id, role_id)
            ON CONFLICT (user_id, role_id) DO NOTHING;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to sync user_id in user_email_status
CREATE OR REPLACE FUNCTION sync_user_email_status_new()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_email_status with the new user_id
    UPDATE user_email_status
    SET user_id = NEW.id
    WHERE email = NEW.email;
    
    -- Assign role based on user_email_status
    PERFORM assign_role_from_status_new(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger with different name
DROP TRIGGER IF EXISTS sync_user_email_status_trigger_new ON auth.users;
CREATE TRIGGER sync_user_email_status_trigger_new
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_email_status_new();

-- Function to update user_email_status with user_id
CREATE OR REPLACE FUNCTION update_user_email_status_new()
RETURNS void AS $$
BEGIN
    -- Update user_email_status with user_ids for existing users
    UPDATE user_email_status ues
    SET user_id = au.id
    FROM auth.users au
    WHERE ues.email = au.email
    AND ues.user_id IS NULL;
    
    -- Assign roles for all users in user_email_status
    FOR user_record IN 
        SELECT user_id, role_name 
        FROM user_email_status 
        WHERE user_id IS NOT NULL
    LOOP
        PERFORM assign_role_from_status_new(user_record.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the update function to sync existing users
SELECT update_user_email_status_new();

-- Verify the assignments
SELECT 
    au.email,
    ues.role_name as intended_role,
    r.role_name as assigned_role
FROM auth.users au
LEFT JOIN user_email_status ues ON au.email = ues.email
LEFT JOIN user_role_assignments ura ON au.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id
ORDER BY au.email; 