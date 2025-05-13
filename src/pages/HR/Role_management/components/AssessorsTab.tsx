import { useState, useMemo } from 'react';
import { supabase } from '../../../../lib/supabase';
import {
  TrashBinIcon
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
  employees: Employee[];
  loadingAssessors: boolean;
  fetchAssessors: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export default function AssessorsTab({ 
  assessors, 
  employees, 
  loadingAssessors, 
  fetchAssessors, 
  fetchUsers 
}: AssessorsTabProps) {
  const [selectedAssessor, setSelectedAssessor] = useState<Employee | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>('');
  const [assessorError, setAssessorError] = useState<string | null>(null);
  const [showAddAssessorModal, setShowAddAssessorModal] = useState(false);
  const [showDeleteAssessorModal, setShowDeleteAssessorModal] = useState(false);
  const [isAddingAssessor, setIsAddingAssessor] = useState(false);
  const [isDeletingAssessor, setIsDeletingAssessor] = useState(false);

  // Filtered employees for search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm) return [];
    
    const searchTermLower = employeeSearchTerm.toLowerCase();
    return employees.filter(
      (employee: Employee) => 
        employee.first_name.toLowerCase().includes(searchTermLower) ||
        employee.last_name.toLowerCase().includes(searchTermLower) ||
        employee.email.toLowerCase().includes(searchTermLower)
    );
  }, [employees, employeeSearchTerm]);

  // Add assessor
  const handleAddAssessor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId) {
      setAssessorError('Please select an employee');
      return;
    }
    
    try {
      setIsAddingAssessor(true);
      setAssessorError(null);
      
      // Get employee details
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('user_id, first_name, last_name, email')
        .eq('id', selectedEmployeeId)
        .single();
        
      if (employeeError) throw employeeError;
      
      console.log('Selected employee:', employeeData);
      
      if (!employeeData.user_id) {
        setAssessorError('Employee has no associated user account');
        setIsAddingAssessor(false);
        return;
      }
      
      // Check if user already has assessor role
      const { data: existingRoles, error: existingRolesError } = await supabase
        .from('user_role_assignments')
        .select(`
          roles:role_id (
            id,
            role_name
          )
        `)
        .eq('user_id', employeeData.user_id);
        
      if (existingRolesError) throw existingRolesError;
      
      console.log('Existing roles:', existingRoles);
      
      // Check if user already has assessor role
      const isAlreadyAssessor = existingRoles.some(item => {
        const role = item.roles as any;
        return role && role.role_name === 'assessor';
      });
      
      if (isAlreadyAssessor) {
        setAssessorError('This employee is already an assessor');
        setIsAddingAssessor(false);
        return;
      }
      
      // Get assessor role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', 'assessor')
        .single();
        
      if (roleError) {
        console.error('Error getting assessor role:', roleError);
        throw roleError;
      }
      
      console.log('Assessor role data:', roleData);
      
      // Remove all existing roles (to ensure only one role)
      for (const roleAssignment of existingRoles) {
        // We need to delete by user_id and role_id since we don't have the assignment id
        const { error: deleteError } = await supabase
          .from('user_role_assignments')
          .delete()
          .eq('user_id', employeeData.user_id)
          .eq('role_id', (roleAssignment.roles as any).id);
          
        if (deleteError) {
          console.error('Error deleting existing role:', deleteError);
          throw deleteError;
        }
      }
      
      // Assign assessor role
      const { error: roleAssignError } = await supabase
        .from('user_role_assignments')
        .insert([
          { 
            user_id: employeeData.user_id,
            role_id: roleData.id
          }
        ]);
        
      if (roleAssignError) {
        console.error('Error assigning assessor role:', roleAssignError);
        throw roleAssignError;
      }
      
      // Refresh assessors list
      await fetchAssessors();
      // Refresh users list to update roles
      await fetchUsers();
      
      setShowAddAssessorModal(false);
      setSelectedEmployeeId('');
      setEmployeeSearchTerm('');
    } catch (error: any) {
      console.error('Error adding assessor:', error);
      if (error.code === '23505') {
        setAssessorError('This employee is already an assessor');
      } else {
        setAssessorError('Failed to add assessor. Please try again: ' + error.message);
      }
    } finally {
      setIsAddingAssessor(false);
    }
  };

  // Delete assessor
  const handleDeleteAssessor = async () => {
    if (!selectedAssessor) return;
    
    try {
      setIsDeletingAssessor(true);
      
      // Get role ID for assessor
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', 'assessor')
        .single();
        
      if (roleError) throw roleError;
      
      // Remove assessor role assignment
      const { error: roleAssignError } = await supabase
        .from('user_role_assignments')
        .delete()
        .eq('user_id', selectedAssessor.user_id)
        .eq('role_id', roleData.id);
        
      if (roleAssignError) throw roleAssignError;
      
      // Refresh assessors list
      await fetchAssessors();
      // Refresh users list to update roles
      await fetchUsers();
      
      setShowDeleteAssessorModal(false);
      setSelectedAssessor(null);
    } catch (error) {
      console.error('Error deleting assessor:', error);
      setAssessorError('Failed to delete assessor. Please try again.');
    } finally {
      setIsDeletingAssessor(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-center">
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
                      <button
                        onClick={() => {
                          setSelectedAssessor(assessor);
                          setShowDeleteAssessorModal(true);
                        }}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                      >
                        <TrashBinIcon className="mr-2 size-4" />
                        Remove
                      </button>
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
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Add Assessor</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Assign an employee as an assessor
            </p>

            {assessorError && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/20">
                <p className="text-red-600 dark:text-red-400">{assessorError}</p>
              </div>
            )}

            <form onSubmit={handleAddAssessor} className="mt-6 space-y-4">
              <div>
                <label htmlFor="employee_search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Employee
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    id="employee_search"
                    placeholder="Search by name or email"
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                  />
                  
                  {employeeSearchTerm && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg dark:bg-gray-800">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((employee: Employee) => (
                          <div
                            key={employee.id}
                            onClick={() => {
                              setSelectedEmployeeId(employee.id);
                              setEmployeeSearchTerm(`${employee.first_name} ${employee.last_name} (${employee.email})`);
                            }}
                            className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                          >
                            {employee.first_name} {employee.last_name} ({employee.email})
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No employees found</div>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedEmployeeId && (
                  <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    Selected: {employees.find(e => e.id === selectedEmployeeId)?.first_name} {employees.find(e => e.id === selectedEmployeeId)?.last_name}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAssessorModal(false);
                    setEmployeeSearchTerm('');
                    setSelectedEmployeeId('');
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isAddingAssessor}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isAddingAssessor || !selectedEmployeeId}
                >
                  {isAddingAssessor ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Assessor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Assessor Confirmation Modal */}
      {showDeleteAssessorModal && selectedAssessor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Remove Assessor</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to remove {selectedAssessor.first_name} {selectedAssessor.last_name} as an assessor?
            </p>
            <p className="mt-2 text-center text-sm text-red-500">
              This will remove their assessor role but will not delete the employee.
            </p>

            {assessorError && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/20">
                <p className="text-red-600 dark:text-red-400">{assessorError}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAssessorModal(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                disabled={isDeletingAssessor}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAssessor}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                disabled={isDeletingAssessor}
              >
                {isDeletingAssessor ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Removing...
                  </>
                ) : (
                  'Remove Assessor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
