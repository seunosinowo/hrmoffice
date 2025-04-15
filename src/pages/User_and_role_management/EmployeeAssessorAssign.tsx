import { useState } from "react";
import { 
  UserIcon, 
  PlusIcon, 
  PencilIcon,
  TrashBinIcon,
  InfoIcon
} from "../../icons";

interface AssessorAssignment {
  id: number;
  employeeName: string;
  employeeRole: string;
  assessorName: string;
  assessorRole: string;
  assignedDate: string;
}

function EmployeeAssessorAssign() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<AssessorAssignment[]>([
    { 
      id: 1, 
      employeeName: "Sarah Johnson", 
      employeeRole: "HR Manager",
      assessorName: "Michael Chen",
      assessorRole: "Senior HR Manager",
      assignedDate: "2023-01-15"
    },
    { 
      id: 2, 
      employeeName: "Emma Rodriguez", 
      employeeRole: "Marketing Specialist",
      assessorName: "Lisa Anderson",
      assessorRole: "Marketing Director",
      assignedDate: "2023-02-20"
    },
    { 
      id: 3, 
      employeeName: "David Wilson", 
      employeeRole: "Sales Representative",
      assessorName: "Robert Brown",
      assessorRole: "Sales Manager",
      assignedDate: "2023-03-10"
    },
    { 
      id: 4, 
      employeeName: "James Taylor", 
      employeeRole: "UX Designer",
      assessorName: "Olivia Martinez",
      assessorRole: "Design Lead",
      assignedDate: "2023-01-28"
    },
  ]);
  
  // Form state
  const [formData, setFormData] = useState({
    employee: "",
    assessor: ""
  });

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(assignment => 
    assignment.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.assessorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (assignmentId: number) => {
    setSelectedUser(assignmentId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser === null) return;
    
    // Update local state
    setAssignments(assignments.filter(a => a.id !== selectedUser));
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get employee and assessor details from the selected values
    const employeeId = parseInt(formData.employee);
    const assessorId = parseInt(formData.assessor);
    
    if (isNaN(employeeId) || isNaN(assessorId)) return;
    
    // Find the selected employee and assessor
    const employee = getEmployeeById(employeeId);
    const assessor = getAssessorById(assessorId);
    
    if (!employee || !assessor) return;
    
    // Create new assignment with local ID
    const newAssignment: AssessorAssignment = {
      id: assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1,
      employeeName: employee.name,
      employeeRole: employee.role,
      assessorName: assessor.name,
      assessorRole: assessor.role,
      assignedDate: new Date().toISOString().split('T')[0]
    };
    
    // Update local state
    setAssignments([newAssignment, ...assignments]);
    
    // Reset form and close modal
    setFormData({
      employee: "",
      assessor: ""
    });
    setShowAddModal(false);
  };

  // Helper functions to get employee and assessor data
  const getEmployeeById = (id: number) => {
    const employees = [
      { id: 1, name: "Sarah Johnson", role: "HR Manager" },
      { id: 2, name: "Emma Rodriguez", role: "Marketing Specialist" },
      { id: 3, name: "David Wilson", role: "Sales Representative" },
      { id: 4, name: "James Taylor", role: "UX Designer" }
    ];
    return employees.find(e => e.id === id);
  };

  const getAssessorById = (id: number) => {
    const assessors = [
      { id: 1, name: "Michael Chen", role: "Senior HR Manager" },
      { id: 2, name: "Lisa Anderson", role: "Marketing Director" },
      { id: 3, name: "Robert Brown", role: "Sales Manager" },
      { id: 4, name: "Olivia Martinez", role: "Design Lead" }
    ];
    return assessors.find(a => a.id === id);
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Assessor Assignments</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage employee assessor relationships</p>
        </div>
        <div className="flex justify-center">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <PlusIcon className="size-4" />
            New Assignment
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
          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
          placeholder="Search by employee or assessor name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Assignments Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Employee
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Assessor
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Assigned Date
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
                        <div className="font-medium text-gray-900 dark:text-white">{assignment.employeeName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{assignment.employeeRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <UserIcon className="size-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900 dark:text-white">{assignment.assessorName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{assignment.assessorRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {assignment.assignedDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => console.log('Edit assignment:', assignment.id)}
                        className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(assignment.id)}
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

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
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
            New Assignment
          </button>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">New Assessor Assignment</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Assign an assessor to an employee
            </p>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="employee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Employee
                </label>
                <select
                  id="employee"
                  name="employee"
                  value={formData.employee}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="">Select employee</option>
                  <option value="1">Sarah Johnson (HR Manager)</option>
                  <option value="2">Emma Rodriguez (Marketing Specialist)</option>
                  <option value="3">David Wilson (Sales Representative)</option>
                  <option value="4">James Taylor (UX Designer)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="assessor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assessor
                </label>
                <select
                  id="assessor"
                  name="assessor"
                  value={formData.assessor}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="">Select assessor</option>
                  <option value="1">Michael Chen (Senior HR Manager)</option>
                  <option value="2">Lisa Anderson (Marketing Director)</option>
                  <option value="3">Robert Brown (Sales Manager)</option>
                  <option value="4">Olivia Martinez (Design Lead)</option>
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
                  Assign Assessor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
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

export default EmployeeAssessorAssign;