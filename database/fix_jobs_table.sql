-- Drop the existing jobs table if it exists
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Create the jobs table with the correct schema
CREATE TABLE public.jobs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
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
            SELECT id FROM public.roles WHERE role_name = 'hr'
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
            SELECT id FROM public.roles WHERE role_name = 'hr'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments
        WHERE user_id = auth.uid()
        AND role_id IN (
            SELECT id FROM public.roles WHERE role_name = 'hr'
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
            SELECT id FROM public.roles WHERE role_name = 'hr'
        )
    )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.jobs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.jobs_id_seq TO authenticated; 