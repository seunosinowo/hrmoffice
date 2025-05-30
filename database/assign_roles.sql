-- First ensure the roles exist
INSERT INTO public.roles (role_name, description)
VALUES 
    ('employee'::public.user_role, 'Regular employee with limited access'),
    ('assessor'::public.user_role, 'Can assess and edit employee profiles'),
    ('hr'::public.user_role, 'HR staff with full access to all features')
ON CONFLICT (role_name) DO NOTHING;

-- Function to assign role to user by email
CREATE OR REPLACE FUNCTION public.assign_role_by_email(
    p_email TEXT,
    p_role_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_role_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found', p_email;
        RETURN FALSE;
    END IF;

    -- Get the role ID
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE role_name = p_role_name::public.user_role;

    IF v_role_id IS NULL THEN
        RAISE NOTICE 'Role % not found', p_role_name;
        RETURN FALSE;
    END IF;

    -- Delete any existing role assignments for this user
    DELETE FROM public.user_role_assignments
    WHERE user_id = v_user_id;

    -- Insert the new role assignment
    INSERT INTO public.user_role_assignments (user_id, role_id)
    VALUES (v_user_id, v_role_id);

    -- Update user_email_status
    INSERT INTO public.user_email_status (email, user_id, role_name)
    VALUES (p_email, v_user_id, p_role_name)
    ON CONFLICT (email) 
    DO UPDATE SET 
        user_id = v_user_id,
        role_name = p_role_name;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.assign_role_by_email TO authenticated;

-- Assign roles to specific users
SELECT public.assign_role_by_email('oluwaseunpaul98@gmail.com', 'hr');
SELECT public.assign_role_by_email('seunosinowo1@gmail.com', 'assessor');
SELECT public.assign_role_by_email('oluwaseun.osinowo@student.aul.edu.ng', 'employee'); 