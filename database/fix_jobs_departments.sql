-- First, let's check if the foreign key constraint exists and drop it if it does
ALTER TABLE public.jobs 
DROP CONSTRAINT IF EXISTS jobs_department_id_fkey;

-- Make sure the department_id column is of type UUID
ALTER TABLE public.jobs 
ALTER COLUMN department_id TYPE UUID USING department_id::UUID;

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_department_id_fkey 
FOREIGN KEY (department_id) 
REFERENCES public.departments(id) 
ON DELETE SET NULL;

-- Enable RLS on the jobs table if not already enabled
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for the jobs table
CREATE POLICY "Allow all authenticated users to view jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow HR users to insert jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE name = 'HR'
    )
  )
);

CREATE POLICY "Allow HR users to update jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE name = 'HR'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE name = 'HR'
    )
  )
);

CREATE POLICY "Allow HR users to delete jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = auth.uid()
    AND role_id IN (
      SELECT id FROM public.roles WHERE name = 'HR'
    )
  )
);

-- Grant necessary permissions
GRANT ALL ON public.jobs TO authenticated; 