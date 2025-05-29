import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import {
  UserIcon,
  ChevronDownIcon,
  GroupIcon
} from "../../../../icons";
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';

interface User {
  id: string;
  email: string;
  roles: string[];
  displayRole?: string;
}

interface UsersTabProps {
  users: User[];
  loadingUsers: boolean;
  fetchUsers: () => Promise<void>;
  fetchAssessors: () => Promise<void>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export default function UsersTab({ users, loadingUsers, fetchUsers, fetchAssessors, setUsers }: UsersTabProps) {
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUpgradeRoleModal, setShowUpgradeRoleModal] = useState(false);
  const [isUpgradingRole, setIsUpgradingRole] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-hide success/error messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleUpgradeRole = async (userId: string, newRole: string) => {
    try {
      setIsUpgradingRole(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Get the role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', newRole)
        .single();

      if (roleError) throw roleError;
      if (!roleData) throw new Error('Role not found');

      // Check if user already has this role
      const { data: existingRole, error: existingError } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('role_id', roleData.id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingRole) {
        toast.error('User already has this role');
        return;
      }

      // Insert the new role assignment
      const { error: insertError } = await supabase
        .from('user_role_assignments')
        .insert([
          {
            user_id: userId,
            role_id: roleData.id,
            assigned_by: currentUser?.id
          }
        ]);

      if (insertError) throw insertError;

      // Update the UI
      setUsers(prevUsers => 
        prevUsers.map(u => {
          if (u.id === userId) {
            const updatedRoles = [...u.roles, newRole];
            return {
              ...u,
              roles: updatedRoles,
              displayRole: formatRoleName(newRole) // Show the newly added role
            };
          }
          return u;
        })
      );

      toast.success(`Successfully added ${formatRoleName(newRole)} role to user`);
      setShowUpgradeRoleModal(false);

      // Refresh the user and assessor lists
      await Promise.all([
        fetchUsers(),
        fetchAssessors()
      ]);
    } catch (error) {
      console.error('Error upgrading role:', error);
      toast.error('Failed to add role');
    } finally {
      setIsUpgradingRole(false);
    }
  };

  const formatRoleName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="size-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="size-5 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Email
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Roles
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
              {loadingUsers ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {user.roles.map(role => formatRoleName(role)).join(', ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUpgradeRoleModal(true);
                            setSuccessMessage(null);
                            setErrorMessage(null);
                          }}
                          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                        >
                          Add Role
                          <ChevronDownIcon className="ml-1 size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Role Modal */}
      {showUpgradeRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Add User Role</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Select a new role for {selectedUser.email}
            </p>
            <p className="mt-2 text-center text-sm text-amber-500">
              Note: This will add a new role to the user's existing roles.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {!selectedUser.roles.includes('hr') && (
                <button
                  onClick={() => handleUpgradeRole(selectedUser.id, 'hr')}
                  className={`flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.05] ${isUpgradingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isUpgradingRole}
                >
                  <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <UserIcon className="size-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">HR</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Full system access</p>
                </button>
              )}

              {!selectedUser.roles.includes('assessor') && (
                <button
                  onClick={() => handleUpgradeRole(selectedUser.id, 'assessor')}
                  className={`flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.05] ${isUpgradingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isUpgradingRole}
                >
                  <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <GroupIcon className="size-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Assessor</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Assess employees</p>
                </button>
              )}

              {!selectedUser.roles.includes('employee') && (
                <button
                  onClick={() => handleUpgradeRole(selectedUser.id, 'employee')}
                  className={`flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.05] ${isUpgradingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isUpgradingRole}
                >
                  <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900/30">
                    <UserIcon className="size-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Employee</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Basic access</p>
                </button>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {isUpgradingRole ? (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
                  Adding role...
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUpgradeRoleModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
