-- First, drop everything to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.user_role_assignments CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Create roles table with proper constraints
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.roles (role_name) VALUES 
    ('employee'),
    ('assessor'),
    ('hr')
ON CONFLICT (role_name) DO NOTHING;

-- Create user_role_assignments table with proper constraints
CREATE TABLE public.user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "roles_select_policy" ON public.roles
    FOR SELECT USING (true);

CREATE POLICY "user_role_assignments_select_policy" ON public.user_role_assignments
    FOR SELECT USING (true);

CREATE POLICY "user_role_assignments_insert_policy" ON public.user_role_assignments
    FOR INSERT WITH CHECK (true);

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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
GRANT ALL ON public.user_role_assignments TO authenticated;
GRANT ALL ON public.user_role_assignments TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Verify the setup
DO $$
BEGIN
    -- Check if roles exist
    IF NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'employee') THEN
        RAISE EXCEPTION 'Employee role not created properly';
    END IF;

    -- Check if trigger exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE EXCEPTION 'Trigger not created properly';
    END IF;

    -- Check if function exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) THEN
        RAISE EXCEPTION 'Function not created properly';
    END IF;

    RAISE NOTICE 'Setup verification completed successfully';
END $$; 