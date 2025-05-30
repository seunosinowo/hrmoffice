-- Enable RLS on employee_departments table if not already enabled
ALTER TABLE public.employee_departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own department assignments" ON public.employee_departments;
DROP POLICY IF EXISTS "Users can create their own department assignments" ON public.employee_departments;
DROP POLICY IF EXISTS "Users can update their own department assignments" ON public.employee_departments;
DROP POLICY IF EXISTS "Users can delete their own department assignments" ON public.employee_departments;
DROP POLICY IF EXISTS "HR and Assessors can manage all department assignments" ON public.employee_departments;

-- Create policies for employee_departments table
-- Allow users to view their own department assignments
CREATE POLICY "Users can view their own department assignments"
ON public.employee_departments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.employees
        WHERE employees.id = employee_departments.employee_id
        AND employees.user_id = auth.uid()
    )
);

-- Allow users to create their own department assignments
CREATE POLICY "Users can create their own department assignments"
ON public.employee_departments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.employees
        WHERE employees.id = employee_departments.employee_id
        AND employees.user_id = auth.uid()
    )
);

-- Allow users to update their own department assignments
CREATE POLICY "Users can update their own department assignments"
ON public.employee_departments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.employees
        WHERE employees.id = employee_departments.employee_id
        AND employees.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.employees
        WHERE employees.id = employee_departments.employee_id
        AND employees.user_id = auth.uid()
    )
);

-- Allow users to delete their own department assignments
CREATE POLICY "Users can delete their own department assignments"
ON public.employee_departments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.employees
        WHERE employees.id = employee_departments.employee_id
        AND employees.user_id = auth.uid()
    )
);

-- Allow HR and Assessors to manage all department assignments
CREATE POLICY "HR and Assessors can manage all department assignments"
ON public.employee_departments
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON r.id = ura.role_id
        WHERE ura.user_id = auth.uid()
        AND r.role_name IN ('hr', 'assessor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.roles r ON r.id = ura.role_id
        WHERE ura.user_id = auth.uid()
        AND r.role_name IN ('hr', 'assessor')
    )
);

-- Grant necessary permissions
GRANT ALL ON public.employee_departments TO authenticated; 