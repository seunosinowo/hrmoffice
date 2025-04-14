import { useState } from "react";
import { 
  UserIcon, 
  PlusIcon, 
  EyeIcon,
  CheckCircleIcon,
  ErrorIcon,
  TimeIcon,
  PencilIcon,
  TrashBinIcon,
  ArrowDownIcon
} from "../../icons";

function Employee() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  // Sample employee data
  const employee = [
    { id: 1, name: "Sarah Johnson", role: "HR Manager", department: "Human Resources", status: "active", joinDate: "2022-03-15" },
    { id: 2, name: "Michael Chen", role: "Software Engineer", department: "Engineering", status: "active", joinDate: "2021-11-22" },
    { id: 3, name: "Emma Rodriguez", role: "Marketing Specialist", department: "Marketing", status: "inactive", joinDate: "2022-05-10" },
    { id: 4, name: "David Wilson", role: "Sales Representative", department: "Sales", status: "active", joinDate: "2022-01-05" },
    { id: 5, name: "Lisa Anderson", role: "Product Manager", department: "Product", status: "active", joinDate: "2021-09-18" },
    { id: 6, name: "James Taylor", role: "UX Designer", department: "Design", status: "inactive", joinDate: "2022-02-28" },
    { id: 7, name: "Olivia Martinez", role: "Finance Analyst", department: "Finance", status: "active", joinDate: "2021-12-14" },
    { id: 8, name: "Robert Brown", role: "Operations Manager", department: "Operations", status: "active", joinDate: "2022-04-03" },
  ];

  // Filter employee based on search term
  const filteredEmployee = employee.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler functions
  const handleView = (userId: number) => {
    setSelectedUser(userId);
    console.log('View employee:', userId);
  };

  const handleEdit = (userId: number) => {
    setSelectedUser(userId);
    setShowEditModal(true);
  };

  const handleDelete = (userId: number) => {
    setSelectedUser(userId);
    setShowDeleteModal(true);
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircleIcon className="size-3" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <ErrorIcon className="size-3" />
          Inactive
        </span>
      );
    }
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Employee Management</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage employees, roles, and permissions</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 min-w-[140px] whitespace-nowrap"
          >
            <PlusIcon className="size-0" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <UserIcon className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{employee.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircleIcon className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Employees</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {employee.filter(emp => emp.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <ErrorIcon className="size-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Employees</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {employee.filter(emp => emp.status === "inactive").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <TimeIcon className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">New This Month</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <EyeIcon className="size-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
            placeholder="Search employees by name, role, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]">
            <ArrowDownIcon className="size-4" />
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]">
            <ArrowDownIcon className="size-4" />
            Sort
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Role
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Department
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Join Date
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
              {filteredEmployee.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center">
                      <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {emp.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900 dark:text-white">{emp.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {emp.role}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {emp.department}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    {getStatusBadge(emp.status)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {emp.joinDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleView(emp.id)}
                        className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
                      >
                        <EyeIcon className="size-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(emp.id)}
                        className="rounded-lg p-1 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="rounded-lg p-1 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
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

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-xs rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Add New Employee</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Fill in the details to add a new employee to the system.
            </p>
            
            <form className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter role"
                />
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <select
                  id="department"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="">Select department</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter email address"
                />
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
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-xs rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Edit Employee</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Update employee information.
            </p>
            
            <form className="mt-6 space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <input
                  type="text"
                  id="edit-role"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter role"
                />
              </div>
              
              <div>
                <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <select
                  id="edit-department"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="">Select department</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="edit-email"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Save Changes
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
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Delete Employee</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this employee? This action cannot be undone.
            </p>
            
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Implement delete logic here
                  console.log('Delete employee:', selectedUser);
                  setShowDeleteModal(false);
                }}
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

export default Employee;