-- First, ensure we have some departments
INSERT INTO public.departments (name, description)
VALUES 
    ('Human Resources', 'HR department responsible for employee management'),
    ('Finance', 'Finance department handling company finances'),
    ('Marketing', 'Marketing department for company promotion'),
    ('Engineering', 'Engineering department for technical development'),
    ('Operations', 'Operations department for business processes')
ON CONFLICT (name) DO NOTHING;

-- Function to assign department to employee
CREATE OR REPLACE FUNCTION public.assign_department_to_employee(
    p_employee_email TEXT,
    p_department_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_employee_id UUID;
    v_department_id UUID;
BEGIN
    -- Get the employee ID
    SELECT id INTO v_employee_id
    FROM public.employees
    WHERE email = p_employee_email;

    IF v_employee_id IS NULL THEN
        RAISE NOTICE 'Employee with email % not found', p_employee_email;
        RETURN FALSE;
    END IF;

    -- Get the department ID
    SELECT id INTO v_department_id
    FROM public.departments
    WHERE name = p_department_name;

    IF v_department_id IS NULL THEN
        RAISE NOTICE 'Department % not found', p_department_name;
        RETURN FALSE;
    END IF;

    -- Insert the department assignment
    INSERT INTO public.employee_departments (employee_id, department_id)
    VALUES (v_employee_id, v_department_id)
    ON CONFLICT (employee_id, department_id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.assign_department_to_employee TO authenticated;

-- Assign departments to employees
SELECT public.assign_department_to_employee('oluwaseunpaul98@gmail.com', 'Human Resources');
SELECT public.assign_department_to_employee('seunosinowo1@gmail.com', 'Engineering');
SELECT public.assign_department_to_employee('oluwaseun.osinowo@student.aul.edu.ng', 'Marketing'); 