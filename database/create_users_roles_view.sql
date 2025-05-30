-- Create a view to show all users and their roles
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as user_created_at,
    au.last_sign_in_at,
    COALESCE(r.role_name, 'employee') as role_name,
    r.description as role_description,
    ues.created_at as role_assigned_at
FROM 
    auth.users au
LEFT JOIN 
    public.user_role_assignments ura ON au.id = ura.user_id
LEFT JOIN 
    public.roles r ON ura.role_id = r.id
LEFT JOIN 
    public.user_email_status ues ON au.email = ues.email;

-- Grant access to the view
GRANT SELECT ON public.users_with_roles TO authenticated;

-- Create a function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role_name TEXT,
    role_description TEXT,
    user_created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    role_assigned_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        COALESCE(r.role_name, 'employee') as role_name,
        r.description as role_description,
        au.created_at,
        au.last_sign_in_at,
        ues.created_at as role_assigned_at
    FROM 
        auth.users au
    LEFT JOIN 
        public.user_role_assignments ura ON au.id = ura.user_id
    LEFT JOIN 
        public.roles r ON ura.role_id = r.id
    LEFT JOIN 
        public.user_email_status ues ON au.email = ues.email
    ORDER BY 
        au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_roles TO authenticated; 