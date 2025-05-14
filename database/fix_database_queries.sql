-- Fix database queries for roles and user_role_assignments

-- First, check if the roles table exists and has the correct structure
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'roles'
) AS roles_table_exists;

-- Check the structure of the roles table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'roles';

-- Check if the user_role_assignments table exists and has the correct structure
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_role_assignments'
) AS user_role_assignments_table_exists;

-- Check the structure of the user_role_assignments table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_role_assignments';

-- Create the user_roles view if it doesn't exist
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

-- Create the user_email_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_email_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the user_email_status table
ALTER TABLE public.user_email_status ENABLE ROW LEVEL SECURITY;

-- Create policies for the user_email_status table
DROP POLICY IF EXISTS "user_email_status_select_policy" ON public.user_email_status;
DROP POLICY IF EXISTS "user_email_status_insert_policy" ON public.user_email_status;
DROP POLICY IF EXISTS "user_email_status_update_policy" ON public.user_email_status;
DROP POLICY IF EXISTS "user_email_status_delete_policy" ON public.user_email_status;

-- Everyone can view user_email_status
CREATE POLICY "user_email_status_select_policy" 
ON public.user_email_status 
FOR SELECT 
USING (true);

-- Only authenticated users with HR role can insert new user_email_status
CREATE POLICY "user_email_status_insert_policy" 
ON public.user_email_status 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
  )
);

-- Only authenticated users with HR role can update user_email_status
CREATE POLICY "user_email_status_update_policy" 
ON public.user_email_status 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
  )
);

-- Only authenticated users with HR role can delete user_email_status
CREATE POLICY "user_email_status_delete_policy" 
ON public.user_email_status 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
  )
);
