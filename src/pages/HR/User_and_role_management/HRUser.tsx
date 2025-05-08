import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface User {
  id: string;
  email: string;
  roles: string[];
}

export default function HRUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email');

      if (usersError) throw usersError;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: roles } = await supabase
            .rpc('get_user_roles', { user_id: user.id });
          return { ...user, roles: roles || [] };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToAssessor = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('upgrade_to_assessor', {
        user_id: userId
      });

      if (error) throw error;

      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error upgrading to assessor:', error);
    }
  };

  const upgradeToHR = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('upgrade_to_hr', {
        user_id: userId
      });

      if (error) throw error;

      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error upgrading to HR:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 border-b dark:border-gray-600 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 border-b dark:border-gray-600 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Roles</th>
              <th className="px-6 py-3 border-b dark:border-gray-600 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {user.roles.join(', ') || 'No roles'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!user.roles.includes('assessor') && (
                    <button
                      onClick={() => upgradeToAssessor(user.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2 transition-colors duration-200"
                    >
                      Make Assessor
                    </button>
                  )}
                  {!user.roles.includes('hr') && (
                    <button
                      onClick={() => upgradeToHR(user.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors duration-200"
                    >
                      Make HR
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
