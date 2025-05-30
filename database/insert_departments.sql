-- Insert initial departments
INSERT INTO public.departments (name, description) VALUES
    ('Human Resources', 'Manages employee relations, recruitment, and HR policies'),
    ('Information Technology', 'Handles IT infrastructure, software development, and technical support'),
    ('Finance', 'Manages financial operations, accounting, and budgeting'),
    ('Marketing', 'Handles marketing strategies, branding, and communications'),
    ('Operations', 'Manages day-to-day business operations and logistics'),
    ('Sales', 'Handles sales operations and customer relationships'),
    ('Research and Development', 'Focuses on innovation and product development'),
    ('Customer Service', 'Manages customer support and satisfaction'),
    ('Legal', 'Handles legal matters and compliance'),
    ('Administration', 'Manages administrative tasks and office operations')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON public.departments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.departments TO authenticated; 