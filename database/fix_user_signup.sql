-- First, ensure the user_role type exists
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('employee', 'assessor', 'hr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create or update the roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name public.user_role NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles if they don't exist
INSERT INTO public.roles (role_name) VALUES 
    ('employee'),
    ('assessor'),
    ('hr')
ON CONFLICT (role_name) DO NOTHING;

-- Create or update the user_role_assignments table
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Create or update the user_email_status table
CREATE TABLE IF NOT EXISTS public.user_email_status (
    email TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name public.user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "roles_select_policy" ON public.roles
    FOR SELECT USING (true);

CREATE POLICY "user_role_assignments_select_policy" ON public.user_role_assignments
    FOR SELECT USING (true);

CREATE POLICY "user_role_assignments_insert_policy" ON public.user_role_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "user_email_status_select_policy" ON public.user_email_status
    FOR SELECT USING (true);

CREATE POLICY "user_email_status_insert_policy" ON public.user_email_status
    FOR INSERT WITH CHECK (true);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id UUID;
    v_error TEXT;
BEGIN
    -- Log the start of the function
    RAISE NOTICE 'Starting handle_new_user for user: %', NEW.id;

    -- Get the employee role ID
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE role_name = 'employee';

    -- If role doesn't exist, create it
    IF v_role_id IS NULL THEN
        RAISE NOTICE 'Employee role not found, creating it';
        INSERT INTO public.roles (role_name)
        VALUES ('employee')
        RETURNING id INTO v_role_id;
    END IF;

    -- Insert the role assignment
    BEGIN
        INSERT INTO public.user_role_assignments (user_id, role_id)
        VALUES (NEW.id, v_role_id);
        RAISE NOTICE 'Successfully assigned employee role to user: %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM;
        RAISE WARNING 'Error assigning role: %', v_error;
        -- Don't rethrow the error, just log it
    END;

    -- Update user_email_status
    BEGIN
        INSERT INTO public.user_email_status (email, user_id, role_name)
        VALUES (NEW.email, NEW.id, 'employee')
        ON CONFLICT (email) 
        DO UPDATE SET 
            user_id = NEW.id,
            role_name = 'employee';
        RAISE NOTICE 'Successfully updated user_email_status for user: %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM;
        RAISE WARNING 'Error updating user_email_status: %', v_error;
        -- Don't rethrow the error, just log it
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
GRANT ALL ON public.user_role_assignments TO authenticated;
GRANT ALL ON public.user_role_assignments TO service_role;
GRANT ALL ON public.user_email_status TO authenticated;
GRANT ALL ON public.user_email_status TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT USAGE ON TYPE public.user_role TO authenticated;
GRANT USAGE ON TYPE public.user_role TO service_role; 