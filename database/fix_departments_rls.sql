-- Enable RLS on departments table if not already enabled
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_update_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON public.departments;

-- Create new policies for departments table

-- Allow everyone to view departments
CREATE POLICY "departments_select_policy"
ON public.departments
FOR SELECT
TO authenticated
USING (true);

-- Allow HR to insert new departments
CREATE POLICY "departments_insert_policy"
ON public.departments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON r.id = ura.role_id
        WHERE ura.user_id = auth.uid()
        AND r.role_name = 'hr'
    )
);

-- Allow HR to update departments
CREATE POLICY "departments_update_policy"
ON public.departments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON r.id = ura.role_id
        WHERE ura.user_id = auth.uid()
        AND r.role_name = 'hr'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON r.id = ura.role_id
        WHERE ura.user_id = auth.uid()
        AND r.role_name = 'hr'
    )
);

-- Allow HR to delete departments
CREATE POLICY "departments_delete_policy"
ON public.departments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON r.id = ura.role_id
        WHERE ura.user_id = auth.uid()
        AND r.role_name = 'hr'
    )
);

-- Grant necessary permissions
GRANT ALL ON public.departments TO authenticated; 