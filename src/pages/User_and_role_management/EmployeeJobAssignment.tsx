import { supabase } from '../../super';
import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  PlusIcon, 
  TrashBinIcon,
  InfoIcon
} from "../../icons";

interface JobAssignment {
  id: number;
  employee_name: string;
  job_title: string;
  department: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function EmployeeJobAssignment() {
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<JobAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Omit<JobAssignment, 'id'>>({
    employee_name: "",
    job_title: "",
    department: "",
    start_date: "",
    end_date: "",
    status: "Active"
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Checking if Supabase client is initialized
      if (!supabase) {
        throw new Error("Supabase client is not initialized");
      }
      
      const { data, error } = await supabase
        .from('employee_job_assignments') 
        .select('*');
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      // Handle empty data case
      if (!data || data.length === 0) {
        setAssignments([]);
        return;
      }
      
      setAssignments(data);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError('Failed to load job assignments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(assignment => 
    assignment.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First insert the new assignment
      const { error: insertError } = await supabase
        .from('employee_job_assignments')
        .insert([formData]);
      
      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
      
      // Then fetch the updated list
      await fetchAssignments();
      
      // Reset form and close modal
      setFormData({
        employee_name: "",
        job_title: "",
        department: "",
        start_date: "",
        end_date: "",
        status: "Active"
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding assignment:", err);
      setError('Failed to add assignment. Please try again later.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssignment) return;
    
    try {
      const { error } = await supabase
        .from('employee_job_assignments')
        .delete()
        .eq('id', selectedAssignment.id);
      
      if (error) {
        console.error("Delete error:", error);
        throw error;
      }
      
      // Refresh the assignments list
      await fetchAssignments();
      
      setShowDeleteModal(false);
      setSelectedAssignment(null);
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setError('Failed to delete assignment. Please try again later.');
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'On Leave':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Employee Job Assignment</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage employee job assignments and roles</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 w-full sm:w-auto"
          >
            <PlusIcon className="size-0" />
            <span className="text-center items-center justify-center -ms-1">New Assignment</span>
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
          placeholder="Search by employee, job title, or department..."
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
                    Employee
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Job Title
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Department
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Start Date
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    End Date
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
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
                      {assignment.job_title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {assignment.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {assignment.start_date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {assignment.end_date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowDeleteModal(true);
                          }}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <TrashBinIcon className="size-4" />
                        </button>
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
            {searchTerm ? 'Try adjusting your search' : 'Create your first job assignment'}
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <PlusIcon className="size-4" />
            New Assignment
          </button>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">New Job Assignment</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Create a new job assignment for an employee
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
                <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Title
                </label>
                <input
                  type="text"
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white [&>option]:dark:bg-gray-900 [&>option]:dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Add Assignment
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
              Are you sure you want to delete this job assignment?
            </p>
            
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}