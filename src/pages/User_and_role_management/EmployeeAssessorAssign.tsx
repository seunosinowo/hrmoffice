import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  PlusIcon, 
  TrashBinIcon,
  InfoIcon,
  PencilIcon,
  ChevronDownIcon
} from "../../icons";

interface AssessorAssignment {
  id: number;
  employee_name: string;
  department: string;
  job_role: string;
  assessor: string;
  created_at: string;
}

interface JobRole {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function EmployeeAssessorAssign() {
  const [assignments, setAssignments] = useState<AssessorAssignment[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssessorAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Omit<AssessorAssignment, 'id' | 'created_at'>>({
    employee_name: "",
    department: "",
    job_role: "",
    assessor: ""
  });
  
  // Loading states for actions
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  useEffect(() => {
    fetchAssignments();
    fetchJobRoles();
    fetchDepartments();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching assignments...");
      
      // Try using a different approach
      const { data, error } = await supabase
        .from('employee_assessor_assignments')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching assignments:", error);
        throw error;
      }
      
      console.log("Fetched assignments:", data);
      setAssignments(data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError('Failed to load assessor assignments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setJobRoles(data || []);
    } catch (err) {
      console.error("Error fetching job roles:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      console.log("Fetching departments...");
      
      // Try using a direct query with explicit schema
      const { data, error, count } = await supabase
        .from('departments')
        .select('*', { count: 'exact' })
        .order('name');

      if (error) {
        console.error("Error fetching departments:", error);
        throw error;
      }
      
      console.log("Fetched departments:", data);
      console.log("Department count:", count);
      
      // If no departments found, try to insert some test data
      if (!data || data.length === 0) {
        console.log("No departments found. Inserting test data...");
        
        // Insert some test departments
        const { data: insertData, error: insertError } = await supabase
          .from('departments')
          .insert([
            { name: 'Human Resources', description: 'HR department' },
            { name: 'Finance', description: 'Finance department' },
            { name: 'Marketing', description: 'Marketing department' }
          ])
          .select();
          
        if (insertError) {
          console.error("Error inserting test departments:", insertError);
        } else {
          console.log("Inserted test departments:", insertData);
          setDepartments(insertData || []);
          return;
        }
      }
      
      setDepartments(data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(assignment => 
    assignment.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.assessor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsAdding(true);
      
      const { data, error } = await supabase
        .from('employee_assessor_assignments')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      
      setAssignments([...assignments, data]);
      setShowAddModal(false);
      setFormData({
        employee_name: "",
        department: "",
        job_role: "",
        assessor: ""
      });
    } catch (err) {
      console.error("Error adding assignment:", err);
      setError('Failed to add assignment. Please try again later.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (assignment: AssessorAssignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      employee_name: assignment.employee_name,
      department: assignment.department,
      job_role: assignment.job_role,
      assessor: assignment.assessor
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment) return;
    
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase
        .from('employee_assessor_assignments')
        .update(formData)
        .eq('id', selectedAssignment.id)
        .select()
        .single();

      if (error) throw error;
      
      setAssignments(assignments.map(assignment => 
        assignment.id === selectedAssignment.id ? data : assignment
      ));
      setShowEditModal(false);
      setSelectedAssignment(null);
    } catch (err) {
      console.error("Error updating assignment:", err);
      setError('Failed to update assignment. Please try again later.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssignment) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('employee_assessor_assignments')
        .delete()
        .eq('id', selectedAssignment.id);

      if (error) throw error;
      
      setAssignments(assignments.filter(assignment => assignment.id !== selectedAssignment.id));
      setShowDeleteModal(false);
      setSelectedAssignment(null);
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setError('Failed to delete assignment. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleDropdown = (id: number) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Employee Assessor Assignment</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage employee assessor assignments</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 w-full sm:w-auto"
          >
            <PlusIcon className="size-0" />
            <span className="text-center items-center justify-center">Employee Assignsor</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <InfoIcon className="size-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
          placeholder="Search by employee, department, job role, or assessor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="size-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading assignments...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={fetchAssignments}
            className="mt-2 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Assignments Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Employee Details
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Department
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Job Role
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Assessor
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
                {filteredAssignments.map((assignment) => (
                  <tr key={`assignment-${assignment.id}-${assignment.employee_name}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <UserIcon className="size-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900 dark:text-white">{assignment.employee_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {assignment.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {assignment.job_role}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {assignment.assessor}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <div className="relative actions-dropdown">
                        <button 
                          onClick={() => toggleDropdown(assignment.id)}
                          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                        >
                          Actions
                          <ChevronDownIcon className="ml-1 size-4" />
                        </button>
                        
                        {activeDropdown === assignment.id && (
                          <div className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900" style={{ position: 'fixed' }}>
                            <button 
                              onClick={() => handleEdit(assignment)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              <PencilIcon className="mr-2 size-4 text-amber-500" />
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setShowDeleteModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              <TrashBinIcon className="mr-2 size-4 text-red-500" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAssignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <UserIcon className="size-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No assignments found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'Create your first assessor assignment'}
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <PlusIcon className="size-4" />
            Employee Assignsor
          </button>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">New Assessor Assignment</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Create a new assessor assignment for an employee
            </p>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2 pl-1">
              <div>
                <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Employee Name
                </label>
                <input
                  type="text"
                  id="employee_name"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white [&>option]:dark:bg-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">Select a department</option>
                  {departments.map(dept => (
                    <option key={`dept-${dept.id}-${dept.name}`} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="job_role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Role
                </label>
                <select
                  id="job_role"
                  value={formData.job_role}
                  onChange={(e) => setFormData({...formData, job_role: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white [&>option]:dark:bg-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">Select a job role</option>
                  {jobRoles.map(role => (
                    <option key={`role-${role.id}-${role.name}`} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="assessor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assessor
                </label>
                <input
                  type="text"
                  id="assessor"
                  value={formData.assessor}
                  onChange={(e) => setFormData({...formData, assessor: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Assignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Edit Assessor Assignment</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Update assessor assignment details
            </p>
            
            <form onSubmit={handleUpdate} className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2 pl-1">
              <div>
                <label htmlFor="edit_employee_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Employee Name
                </label>
                <input
                  type="text"
                  id="edit_employee_name"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="edit_department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <select
                  id="edit_department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white [&>option]:dark:bg-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">Select a department</option>
                  {departments.map(dept => (
                    <option key={`dept-${dept.id}-${dept.name}`} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="edit_job_role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Role
                </label>
                <select
                  id="edit_job_role"
                  value={formData.job_role}
                  onChange={(e) => setFormData({...formData, job_role: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white [&>option]:dark:bg-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">Select a job role</option>
                  {jobRoles.map(role => (
                    <option key={`role-${role.id}-${role.name}`} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="edit_assessor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assessor
                </label>
                <input
                  type="text"
                  id="edit_assessor"
                  value={formData.assessor}
                  onChange={(e) => setFormData({...formData, assessor: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Assignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-xs rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Delete Assignment</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this assessor assignment?
            </p>
            
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}