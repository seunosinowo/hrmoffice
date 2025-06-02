-- First, enable RLS on the table
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "user_role_assignments_select_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_insert_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_update_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_delete_policy" ON public.user_role_assignments;

-- Create new policies
-- Everyone can view role assignments
CREATE POLICY "user_role_assignments_select_policy" 
ON public.user_role_assignments 
FOR SELECT 
USING (true);

-- Allow role assignments during sign-up and by HR
CREATE POLICY "user_role_assignments_insert_policy" 
ON public.user_role_assignments 
FOR INSERT 
TO authenticated
WITH CHECK (
    -- Allow if the user is assigning to themselves during sign-up
    auth.uid() = user_id
    OR 
    -- Allow if the user has HR role
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON ura.role_id = r.id
        WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
    )
    OR
    -- Allow if this is the first role assignment (during sign-up)
    NOT EXISTS (
        SELECT 1 FROM public.user_role_assignments
        WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to update their own role assignments
CREATE POLICY "user_role_assignments_update_policy" 
ON public.user_role_assignments 
FOR UPDATE 
TO authenticated
USING (
    auth.uid() = user_id
    OR 
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON ura.role_id = r.id
        WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
    )
);

-- Allow authenticated users to delete their own role assignments
CREATE POLICY "user_role_assignments_delete_policy" 
ON public.user_role_assignments 
FOR DELETE 
TO authenticated
USING (
    auth.uid() = user_id
    OR 
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON ura.role_id = r.id
        WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
    )
);

-- Create a function to assign roles that bypasses RLS
CREATE OR REPLACE FUNCTION public.assign_role(
    p_user_id UUID,
    p_role_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_id UUID;
    v_assignment_id UUID;
BEGIN
    -- Get the role ID
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE role_name = p_role_name::public.user_role;

    -- If role doesn't exist, create it
    IF v_role_id IS NULL THEN
        INSERT INTO public.roles (role_name)
        VALUES (p_role_name::public.user_role)
        RETURNING id INTO v_role_id;
    END IF;

    -- Check if the role assignment already exists
    IF NOT EXISTS (
        SELECT 1 FROM public.user_role_assignments
        WHERE user_id = p_user_id AND role_id = v_role_id
    ) THEN
        -- Insert the new role assignment
        INSERT INTO public.user_role_assignments (user_id, role_id)
        VALUES (p_user_id, v_role_id)
        RETURNING id INTO v_assignment_id;
    END IF;

    -- Update user_email_status
    INSERT INTO public.user_email_status (email, user_id, role_name)
    SELECT email, p_user_id, p_role_name
    FROM auth.users
    WHERE id = p_user_id
    ON CONFLICT (email) 
    DO UPDATE SET 
        user_id = p_user_id,
        role_name = p_role_name;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to remove a role from a user
CREATE OR REPLACE FUNCTION public.remove_role(
    p_user_id UUID,
    p_role_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_id UUID;
BEGIN
    -- Get the role ID
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE role_name = p_role_name::public.user_role;

    -- If role doesn't exist, return false
    IF v_role_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Delete the role assignment
    DELETE FROM public.user_role_assignments
    WHERE user_id = p_user_id AND role_id = v_role_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION public.assign_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_role TO authenticated;

-- Create a trigger to assign default role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id UUID;
BEGIN
    -- Get the employee role ID
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE role_name = 'employee';

    -- If role doesn't exist, create it
    IF v_role_id IS NULL THEN
        INSERT INTO public.roles (role_name)
        VALUES ('employee')
        RETURNING id INTO v_role_id;
    END IF;

    -- Insert the role assignment directly
    INSERT INTO public.user_role_assignments (user_id, role_id)
    VALUES (NEW.id, v_role_id);

    -- Update user_email_status
    INSERT INTO public.user_email_status (email, user_id, role_name)
    VALUES (NEW.email, NEW.id, 'employee')
    ON CONFLICT (email) 
    DO UPDATE SET 
        user_id = NEW.id,
        role_name = 'employee';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.user_role_assignments TO authenticated;
GRANT ALL ON public.user_email_status TO authenticated;
GRANT USAGE ON TYPE public.user_role TO authenticated;

-- Ensure the tables exist with correct structure
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name public.user_role NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.user_email_status (
    email TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name public.user_role NOT NULL
);

-- Create the user_role type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('employee', 'assessor', 'hr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 