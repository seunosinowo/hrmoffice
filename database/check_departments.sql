-- First, let's check if the department exists
SELECT id, name FROM public.departments WHERE id = 'adc40e76-e5d4-4043-bd13-6c3ba2e2c309';

-- If the department doesn't exist, we need to either:
-- 1. Insert the correct department first, or
-- 2. Use a valid department ID from the existing departments

-- Let's see what departments we have
SELECT id, name FROM public.departments ORDER BY name;

-- If you need to insert a new department, use this format:
-- INSERT INTO public.departments (id, name, description)
-- VALUES ('adc40e76-e5d4-4043-bd13-6c3ba2e2c309', 'Department Name', 'Department Description')
-- ON CONFLICT (id) DO NOTHING; 