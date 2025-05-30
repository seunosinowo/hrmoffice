-- Add assigned_by column to user_role_assignments
ALTER TABLE public.user_role_assignments
ADD COLUMN assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS user_role_assignments_delete_policy ON public.user_role_assignments;
DROP POLICY IF EXISTS user_role_assignments_insert_policy ON public.user_role_assignments;
DROP POLICY IF EXISTS user_role_assignments_select_policy ON public.user_role_assignments;
DROP POLICY IF EXISTS user_role_assignments_update_policy ON public.user_role_assignments;

-- Create new policies
-- SELECT policy: Allow all authenticated users to view role assignments
CREATE POLICY user_role_assignments_select_policy ON public.user_role_assignments
FOR SELECT TO authenticated
USING (true);

-- INSERT policy: Only HR can assign roles
CREATE POLICY user_role_assignments_insert_policy ON public.user_role_assignments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON r.id = ura.role_id
    WHERE ura.user_id = auth.uid()
    AND r.role_name = 'hr'
  )
);

-- UPDATE policy: Only HR can update role assignments
CREATE POLICY user_role_assignments_update_policy ON public.user_role_assignments
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON r.id = ura.role_id
    WHERE ura.user_id = auth.uid()
    AND r.role_name = 'hr'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON r.id = ura.role_id
    WHERE ura.user_id = auth.uid()
    AND r.role_name = 'hr'
  )
);

-- DELETE policy: Only HR can delete role assignments
CREATE POLICY user_role_assignments_delete_policy ON public.user_role_assignments
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON r.id = ura.role_id
    WHERE ura.user_id = auth.uid()
    AND r.role_name = 'hr'
  )
); 