-- Fix for the ambiguous column reference issue

-- First, let's check the structure of the user_role_assignments table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_role_assignments';

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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "user_role_assignments_select_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_insert_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_update_policy" ON public.user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_delete_policy" ON public.user_role_assignments;

-- Create new policies that don't cause infinite recursion and use table aliases
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
  public.has_hr_role(auth.uid())
);

-- Only authenticated users with HR role can update role assignments
CREATE POLICY "user_role_assignments_update_policy" 
ON public.user_role_assignments 
FOR UPDATE 
TO authenticated
USING (
  public.has_hr_role(auth.uid())
);

-- Only authenticated users with HR role can delete role assignments
CREATE POLICY "user_role_assignments_delete_policy" 
ON public.user_role_assignments 
FOR DELETE 
TO authenticated
USING (
  public.has_hr_role(auth.uid())
);

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
  
  -- Update user_email_status if it exists
  BEGIN
    -- Get the user's email
    DECLARE
      v_email TEXT;
    BEGIN
      SELECT email INTO v_email
      FROM auth.users
      WHERE id = p_user_id;
      
      IF v_email IS NOT NULL THEN
        -- Try to update user_email_status
        BEGIN
          INSERT INTO public.user_email_status (email, user_id, role_name)
          VALUES (v_email, p_user_id, p_role_name)
          ON CONFLICT (email) 
          DO UPDATE SET 
            user_id = p_user_id,
            role_name = p_role_name;
        EXCEPTION
          WHEN OTHERS THEN
            -- Ignore errors with user_email_status
            NULL;
        END;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore errors getting email
        NULL;
    END;
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignore errors with user_email_status
      NULL;
  END;
  
  RETURN v_assignment_id IS NOT NULL;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;
