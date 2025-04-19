import { supabase } from './supabase';

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