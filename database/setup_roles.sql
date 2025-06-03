-- Create the user_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('employee', 'assessor', 'hr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name public.user_role NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_role_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Insert default roles if they don't exist
INSERT INTO public.roles (role_name)
VALUES 
    ('employee'),
    ('assessor'),
    ('hr')
ON CONFLICT (role_name) DO NOTHING;

-- Create function to assign default role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the employee role ID
    DECLARE
        employee_role_id UUID;
    BEGIN
        SELECT id INTO employee_role_id
        FROM public.roles
        WHERE role_name = 'employee';

        -- Assign the employee role to the new user
        INSERT INTO public.user_role_assignments (user_id, role_id)
        VALUES (NEW.id, employee_role_id);
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS assign_default_role_trigger ON auth.users;

-- Create the trigger
CREATE TRIGGER assign_default_role_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_role();

-- Grant necessary permissions
GRANT USAGE ON TYPE public.user_role TO authenticated;
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.user_role_assignments TO authenticated;

-- Enable RLS on both tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for roles table
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
CREATE POLICY "roles_select_policy" ON public.roles
    FOR SELECT USING (true);

-- Create RLS policies for user_role_assignments table
DROP POLICY IF EXISTS "user_role_assignments_select_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_insert_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_update_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_delete_policy" ON public.user_role_assignments;

-- Everyone can view role assignments
CREATE POLICY "user_role_assignments_select_policy" ON public.user_role_assignments
    FOR SELECT USING (true);

-- Only authenticated users with HR role can insert new role assignments
CREATE POLICY "user_role_assignments_insert_policy" ON public.user_role_assignments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_role_assignments ura
            JOIN public.roles r ON ura.role_id = r.id
            WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
        )
    );

-- Only authenticated users with HR role can update role assignments
CREATE POLICY "user_role_assignments_update_policy" ON public.user_role_assignments
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_role_assignments ura
            JOIN public.roles r ON ura.role_id = r.id
            WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
        )
    );

-- Only authenticated users with HR role can delete role assignments
CREATE POLICY "user_role_assignments_delete_policy" ON public.user_role_assignments
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_role_assignments ura
            JOIN public.roles r ON ura.role_id = r.id
            WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
        )
    );

-- Drop and recreate the user_roles view
DROP VIEW IF EXISTS public.user_roles;
CREATE OR REPLACE VIEW public.user_roles AS
SELECT 
    ura.user_id,
    r.role_name
FROM 
    public.user_role_assignments ura
JOIN 
    public.roles r ON ura.role_id = r.id;

-- Grant access to the view
GRANT SELECT ON public.user_roles TO authenticated;

-- Drop the trigger first (since it depends on the function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop the functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.assign_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);

-- Create a function to assign a role to a user
CREATE OR REPLACE FUNCTION public.assign_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_id UUID;
    v_assignment_id UUID;
BEGIN
    -- Get the role ID
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE role_name = p_role_name;

    -- If role doesn't exist, create it
    IF v_role_id IS NULL THEN
        INSERT INTO public.roles (role_name)
        VALUES (p_role_name)
        RETURNING id INTO v_role_id;
    END IF;

    -- Delete any existing role assignments for this user
    DELETE FROM public.user_role_assignments
    WHERE user_id = p_user_id;

    -- Insert the new role assignment
    INSERT INTO public.user_role_assignments (user_id, role_id)
    VALUES (p_user_id, v_role_id)
    RETURNING id INTO v_assignment_id;

    RETURN v_assignment_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.assign_role TO authenticated;

-- Create a function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_role_assignments ura
        JOIN public.roles r ON ura.role_id = r.id
        WHERE ura.user_id = p_user_id AND r.role_name = p_role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;

-- Create a trigger to assign default role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Assign the default 'employee' role to new users
    PERFORM public.assign_role(NEW.id, 'employee');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 