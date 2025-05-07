import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key is not defined in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Profile operations
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Employee Details operations
export const getEmployeeDetails = async (userId: string) => {
  const { data, error } = await supabase
    .from('employee_details')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Job Assignments operations
export const getJobAssignments = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('job_assignments')
    .select('*')
    .eq('employee_id', employeeId);
  
  if (error) throw error;
  return data;
};

// Update profile
export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
};

// Job operations
export const getJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      description,
      department_id,
      departments (
        id,
        name
      )
    `)
    .order('title', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const createJob = async (jobData: {
  title: string;
  description: string;
  department_id: string;
}) => {
  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select(`
      id,
      title,
      description,
      department_id,
      departments!inner (
        id,
        name
      )
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateJob = async (id: number, jobData: {
  title?: string;
  description?: string;
  department_id?: string;
}) => {
  const { data, error } = await supabase
    .from('jobs')
    .update(jobData)
    .eq('id', id)
    .select(`
      id,
      title,
      description,
      department_id,
      departments!inner (
        id,
        name
      )
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteJob = async (id: number) => {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Clear all data from Supabase tables
export const clearAllData = async () => {
  try {
    // Clear jobs table
    const { error: jobsError } = await supabase
      .from('jobs')
      .delete()
      .neq('id', 0); // Delete all records

    if (jobsError) throw jobsError;

    // Clear departments table
    const { error: departmentsError } = await supabase
      .from('departments')
      .delete()
      .neq('id', 0); // Delete all records

    if (departmentsError) throw departmentsError;

    // Clear employee_job_assignments table
    const { error: assignmentsError } = await supabase
      .from('employee_job_assignments')
      .delete()
      .neq('id', 0);

    if (assignmentsError) throw assignmentsError;

    // Clear employee_assessor_assignments table
    const { error: assessorError } = await supabase
      .from('employee_assessor_assignments')
      .delete()
      .neq('id', 0);

    if (assessorError) throw assessorError;

    // Clear job_roles table
    const { error: rolesError } = await supabase
      .from('job_roles')
      .delete()
      .neq('id', 0);

    if (rolesError) throw rolesError;

    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

// Function to assign default role to new users
export const assignDefaultRole = async (userId: string) => {
  const { error } = await supabase
    .from('profiles') // Assuming 'profiles' table stores user roles
    .update({ role: 'employee' })
    .eq('id', userId);

  if (error) {
    console.error('Error assigning default role:', error);
    throw error;
  }
};

// Function to update user role
export const updateUserRole = async (userId: string, newRole: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};