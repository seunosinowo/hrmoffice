-- Fix for the user_roles view issue

-- First, check if user_roles is a table
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_roles' AND table_type = 'BASE TABLE'
) AS user_roles_is_table;

-- If it's a table, we need to handle it differently
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

-- Create a function to update user roles if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_user_role_status(
  p_user_id UUID,
  p_email TEXT,
  p_role_name TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update or insert into user_email_status
  INSERT INTO public.user_email_status (email, user_id, role_name)
  VALUES (p_email, p_user_id, p_role_name)
  ON CONFLICT (email) 
  DO UPDATE SET 
    user_id = p_user_id,
    role_name = p_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_user_role_status TO authenticated;
