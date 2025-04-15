import { useState } from "react";
import { 
  UserIcon, 
  PlusIcon, 
  EyeIcon,
  CheckCircleIcon,
  ErrorIcon,
  TrashBinIcon,
  UserCircleIcon
} from "../../icons";

function Employee() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  
  const employees = [
    { 
      id: 1, 
      name: "Sarah Johnson", 
      role: "HR Manager", 
      department: "Human Resources", 
      status: "active", 
      joinDate: "2022-03-15",
      profilePic: "/images/user/owner.jpeg"
    },
    { 
      id: 2, 
      name: "Michael Chen", 
      role: "Software Engineer", 
      department: "Engineering", 
      status: "active", 
      joinDate: "2021-11-22",
      profilePic: "/images/user/owner.jpeg"
    },
    { 
      id: 3, 
      name: "Emma Rodriguez", 
      role: "Marketing Specialist", 
      department: "Marketing", 
      status: "inactive", 
      joinDate: "2022-05-10",
      profilePic: "/images/user/owner.jpeg"
    },
    { 
      id: 4, 
      name: "David Wilson", 
      role: "Sales Representative", 
      department: "Sales", 
      status: "active", 
      joinDate: "2022-01-05",
      profilePic: "https://randomuser.me/api/portraits/men/75.jpg"
    },
    { 
      id: 5, 
      name: "Lisa Anderson", 
      role: "Product Manager", 
      department: "Product", 
      status: "active", 
      joinDate: "2021-09-18",
      profilePic: "https://randomuser.me/api/portraits/women/33.jpg"
    },
    { 
      id: 6, 
      name: "James Taylor", 
      role: "UX Designer", 
      department: "Design", 
      status: "inactive", 
      joinDate: "2022-02-28",
      profilePic: "https://randomuser.me/api/portraits/men/45.jpg"
    },
  ];

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge component
  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircleIcon className="size-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <ErrorIcon className="size-3" />
        Inactive
      </span>
    );
  };

  // role color
  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      "HR Manager": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      "Software Engineer": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      "Marketing Specialist": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
      "Sales Representative": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      "Product Manager": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      "UX Designer": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    };
    return roleColors[role] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Employee</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Digital energy employees</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 min-w-[140px] whitespace-nowrap"
          >
            <PlusIcon className="size-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
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

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredEmployees.map((emp) => (
          <div 
            key={emp.id} 
            className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50 dark:hover:shadow-none"
          >
            <div className="flex flex-col items-center">
              {/* Profile Picture */}
              <div className="relative mb-4">
                <img 
                  src={emp.profilePic} 
                  alt={emp.name}
                  className="size-20 rounded-full object-cover border-2 border-white shadow-md dark:border-gray-700"
                />
                {/* Status Indicator */}
                <div className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-white ${emp.status === 'active' ? 'bg-green-500' : 'bg-red-500'} dark:border-gray-700`}></div>
              </div>
              
              {/* Employee Info */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{emp.name}</h3>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getRoleColor(emp.role)}`}>
                {emp.role}
              </span>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{emp.department}</p>
              
              {/* Join Date */}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Joined: {emp.joinDate}
              </p>
              
              {/* Status & Actions */}
              <div className="mt-4 flex w-full items-center justify-between">
                {getStatusBadge(emp.status)}
                <div className="flex gap-2">
                  <button 
                    onClick={() => console.log('View profile:', emp.id)}
                    className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                    title="View Profile"
                  >
                    <UserCircleIcon className="size-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedUser(emp.id);
                      setShowDeleteModal(true);
                    }}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                    title="Delete"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Employee</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Fill in the details to add a new employee to your organization.
            </p>
            
            <form className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter role"
                />
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter department"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </form>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Add employee');
                  setShowAddModal(false);
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Employee</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this employee? This action cannot be undone.
            </p>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Delete employee:', selectedUser);
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <UserIcon className="size-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No employees found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or add a new employee
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <PlusIcon className="size-4" />
            Add Employee
          </button>
        </div>
      )}
    </div>
  );
}

export default Employee;