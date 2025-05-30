-- Fix RLS policies for user_role_assignments table
-- First, check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_role_assignments';

-- Enable RLS if not already enabled
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "user_role_assignments_select_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_insert_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_update_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_delete_policy" ON public.user_role_assignments;

-- Create new policies that don't cause infinite recursion
-- Everyone can view role assignments
CREATE POLICY "user_role_assignments_select_policy"
ON public.user_role_assignments
FOR SELECT
USING (true);

-- Only authenticated users with HR role can insert new role assignments
CREATE POLICY "user_role_assignments_insert_policy"
ON public.user_role_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
  )
);

-- Only authenticated users with HR role can update role assignments
CREATE POLICY "user_role_assignments_update_policy"
ON public.user_role_assignments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
  )
);

-- Only authenticated users with HR role can delete role assignments
CREATE POLICY "user_role_assignments_delete_policy"
ON public.user_role_assignments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    JOIN public.roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid() AND r.role_name = 'hr'
  )
);

-- Handle the user_roles view or table
DO $$
BEGIN
  -- Check if user_roles is a table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND table_type = 'BASE TABLE'
  ) THEN
    -- If it's a table, we'll create a different view name
    DROP VIEW IF EXISTS public.user_role_view;

    EXECUTE 'CREATE OR REPLACE VIEW public.user_role_view AS
      SELECT
        ura.user_id,
        r.role_name
      FROM
        public.user_role_assignments ura
      JOIN
        public.roles r ON ura.role_id = r.id';

    EXECUTE 'GRANT SELECT ON public.user_role_view TO authenticated';

    -- Update the AuthContext.tsx code to use user_role_view instead of user_roles
    RAISE NOTICE 'Created user_role_view instead of user_roles. You need to update your code to use this new view name.';
  ELSE
    -- If user_roles exists as a view, drop and recreate it
    DROP VIEW IF EXISTS public.user_roles;

    EXECUTE 'CREATE OR REPLACE VIEW public.user_roles AS
      SELECT
        ura.user_id,
        r.role_name
      FROM
        public.user_role_assignments ura
      JOIN
        public.roles r ON ura.role_id = r.id';

    EXECUTE 'GRANT SELECT ON public.user_roles TO authenticated';

    RAISE NOTICE 'Successfully recreated the user_roles view.';
  END IF;
END
$$;

-- Create a function to check if a user has HR role without recursion
CREATE OR REPLACE FUNCTION public.has_hr_role(user_id UUID)
RETURNS BOOLEAN AS $func$
DECLARE
  has_role BOOLEAN;
BEGIN
  -- Direct query to the database bypassing RLS
  -- Use table aliases to avoid ambiguous column references
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_role_assignments ura
    JOIN public.roles r ON ura.role_id = r.id
    WHERE ura.user_id = user_id AND r.role_name = 'hr'
  ) INTO has_role;
  
  RETURN has_role;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.has_hr_role TO authenticated;

-- Create a function to update user roles that avoids ambiguous column references
CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id UUID,
  p_role_name TEXT
) RETURNS BOOLEAN AS $func$
DECLARE
  v_role_id UUID;
  v_assignment_id UUID;
BEGIN
  -- Get the role ID for the role name
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE role_name = p_role_name;
  
  -- If role doesn't exist, create it
  IF v_role_id IS NULL THEN
    INSERT INTO public.roles (role_name)
    VALUES (p_role_name)
    RETURNING id INTO v_role_id;
  END IF;
  
  -- Delete existing role assignments for this user
  DELETE FROM public.user_role_assignments
  WHERE user_id = p_user_id;
  
  -- Insert the new role assignment
  INSERT INTO public.user_role_assignments (user_id, role_id)
  VALUES (p_user_id, v_role_id)
  RETURNING id INTO v_assignment_id;
  
  RETURN v_assignment_id IS NOT NULL;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;
