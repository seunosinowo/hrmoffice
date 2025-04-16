import { UserIcon, PencilIcon, TrashBinIcon, EyeIcon } from "../../icons";

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "HR Manager",
    department: "Human Resources",
    avatar: "/images/user/owner.jpeg",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Software Engineer",
    department: "Engineering",
    avatar: "/images/user/owner.jpeg",
  },
];

export default function UserManagement() {
  const handleViewProfile = (userId: number) => {
    console.log(`View profile ${userId}`);
  };

  const handleEditProfile = (userId: number) => {
    console.log(`Edit profile ${userId}`);
  };

  const handleDeleteProfile = (userId: number) => {
    console.log(`Delete profile ${userId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          User Management
        </h2>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          <UserIcon className="size-4" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex flex-col items-center">
              <div className="relative mb-4 size-20 overflow-hidden rounded-full">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    <UserIcon className="size-10" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                {user.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {user.department}
              </p>
            </div>

            <div className="mt-6 flex justify-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            <button
            onClick={() => handleViewProfile(user.id)}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-100 px-2 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900"
            title="View Profile"
          >
            <EyeIcon className="size-0" />
            <span>View</span>
          </button>

              <button
                onClick={() => handleEditProfile(user.id)}
                className="flex items-center gap-1 rounded-lg bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900"
                title="Edit Profile"
              >
                <PencilIcon className="size-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteProfile(user.id)}
                className="flex items-center gap-1 rounded-lg bg-red-100 px-4 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900"
                title="Delete Profile"
              >
                <TrashBinIcon className="size-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}