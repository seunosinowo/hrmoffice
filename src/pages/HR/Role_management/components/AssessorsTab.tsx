import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import {
} from "../../../../icons";

interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  departments?: any[];
}

interface AssessorsTabProps {
  assessors: Employee[];
  fetchAssessors: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export default function AssessorsTab({
  assessors,
  fetchAssessors,
  fetchUsers
}: AssessorsTabProps) {
  const [assessorError, setAssessorError] = useState<string | null>(null);
  const [showAddAssessorModal, setShowAddAssessorModal] = useState(false);
  const [isAddingAssessor, setIsAddingAssessor] = useState(false);
  const [employeeAssignments, setEmployeeAssignments] = useState<any[]>([]);

  // Add all users with assessor role to the assessors table
  const handleAddAssessor = async () => {
    try {
      setIsAddingAssessor(true);
      setAssessorError(null);

      // Get all users with assessor role
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_role_assignments')
        .select(`
          user_id,
          roles:role_id (
            id,
            role_name
          )
        `)
        .eq('roles.role_name', 'assessor');

      if (roleError) throw roleError;

      if (!roleAssignments || roleAssignments.length === 0) {
        setAssessorError('No users with assessor role found');
        setIsAddingAssessor(false);
        return;
      }

      console.log('Found assessor role assignments:', roleAssignments);

      // Get the user IDs of all assessors
      const assessorUserIds = roleAssignments.map(item => item.user_id);

      // Get employee details for these assessors
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          email
        `)
        .in('user_id', assessorUserIds);

      if (employeeError) throw employeeError;

      // Check if we have employee data
      if (!employeeData || employeeData.length === 0) {
        console.log('No employee profiles found, using auth users data instead');

        // Get user data from auth
        const { data: authUsers, error: authError } = await supabase
          .from('auth_users_view')
          .select('id, email')
          .in('id', assessorUserIds);

        if (authError) throw authError;

        if (!authUsers || authUsers.length === 0) {
          setAssessorError('No user data found for assessors');
          setIsAddingAssessor(false);
          return;
        }

        // Create assessor records from auth users
        const assessorsToInsert = authUsers.map(user => {
          // Extract name from email (e.g., john.doe@example.com -> John Doe)
          const emailName = user.email.split('@')[0];
          const nameParts = emailName.replace(/[^a-zA-Z0-9]/g, ' ').split(' ').filter(Boolean);
          const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Assessor';
          const lastName = nameParts.length > 1 ?
            nameParts.slice(1).map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') :
            'User';

          return {
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email
          };
        });

        // Insert with upsert to avoid duplicates
        const { data: insertedData, error: insertError } = await supabase
          .from('assessors')
          .upsert(assessorsToInsert, {
            onConflict: 'user_id',
            ignoreDuplicates: false // Update existing records
          })
          .select();

        if (insertError) {
          console.error('Error inserting assessors from auth users:', insertError);
          throw insertError;
        }

        console.log('Successfully added/updated assessors from auth users:', insertedData);
      } else {
        console.log('Found employee data for assessors:', employeeData);

        // Insert into assessors table
        const assessorsToInsert = employeeData.map(emp => ({
          employee_id: emp.id,
          user_id: emp.user_id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email
        }));

        // Insert with upsert to avoid duplicates
        const { data: insertedData, error: insertError } = await supabase
          .from('assessors')
          .upsert(assessorsToInsert, {
            onConflict: 'user_id',
            ignoreDuplicates: false // Update existing records
          })
          .select();

        if (insertError) {
          console.error('Error inserting assessors:', insertError);
          throw insertError;
        }

        console.log('Successfully added/updated assessors from employee data:', insertedData);
      }

      // Get all employee assessor assignments to show in the info message
      const { data: assignments, error: assignmentsError } = await supabase
        .from('employee_assessor_assignments')
        .select(`
          id,
          employee_name,
          assessor,
          assessor_id,
          department,
          job_role,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        console.error('Error fetching employee assessor assignments:', assignmentsError);
      } else {
        console.log('Employee assessor assignments:', assignments);
        setEmployeeAssignments(assignments || []);
      }

      // Refresh assessors list
      await fetchAssessors();
      // Refresh users list to update roles
      await fetchUsers();

      setShowAddAssessorModal(false);
    } catch (error: any) {
      console.error('Error adding assessors:', error);
      setAssessorError('Failed to add assessors. Please try again: ' + error.message);
    } finally {
      setIsAddingAssessor(false);
    }
  };



  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar (can be added later if needed) */}
        <div className="relative w-full sm:max-w-xs">
          {/* Placeholder for search functionality */}
        </div>

        {/* Add Assessor Button */}
        <button
          onClick={() => setShowAddAssessorModal(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Add Assessor
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Name
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Email
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Department
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
              {assessors.length > 0 ? (
                assessors.map((assessor) => (
                  <tr key={assessor.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {assessor.first_name} {assessor.last_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {assessor.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {assessor.departments && assessor.departments.length > 0
                        ? assessor.departments.map((dept: any) => dept.name).join(', ')
                        : 'No department'
                      }
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No assessors found. Add an assessor to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Assessor Modal */}
      {showAddAssessorModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Add Assessors</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              This will add all users with the assessor role to the assessors table
            </p>

            {assessorError && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/20">
                <p className="text-red-600 dark:text-red-400">{assessorError}</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <p className="font-medium">Information</p>
                <p className="mt-1">
                  Clicking "Add Assessors" will find all users with the assessor role and add them to the assessors table.
                  This will make them available for selection in the Employee Assessor Assignment page.
                </p>
                <p className="mt-2">
                  These assessors will be able to view employee details in the Assessor section.
                </p>
              </div>

              {employeeAssignments.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/20">
                  <h3 className="font-medium text-gray-900 dark:text-white">Current Employee-Assessor Assignments</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    These are the current assignments from the Employee Assessor Assign page:
                  </p>
                  <div className="mt-3 max-h-40 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Employee
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Assessor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
                        {employeeAssignments.map((assignment) => (
                          <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                            <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900 dark:text-white">
                              {assignment.employee_name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900 dark:text-white">
                              {assignment.assessor}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAssessorModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isAddingAssessor}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddAssessor}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isAddingAssessor}
                >
                  {isAddingAssessor ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Assessors'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
