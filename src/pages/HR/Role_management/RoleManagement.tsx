import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface User {
  id: string;
  email: string;
  roles: string[];
}

interface UserData {
  id: string;
  email: string;
}

export default function RoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email');

      if (usersError) throw usersError;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (usersData as UserData[]).map(async (user) => {
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
      <h1 className="text-2xl font-bold mb-4">User Role Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b">Email</th>
              <th className="px-6 py-3 border-b">Current Roles</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 border-b">{user.email}</td>
                <td className="px-6 py-4 border-b">
                  {user.roles.join(', ') || 'No roles'}
                </td>
                <td className="px-6 py-4 border-b">
                  {!user.roles.includes('assessor') && (
                    <button
                      onClick={() => upgradeToAssessor(user.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                    >
                      Make Assessor
                    </button>
                  )}
                  {!user.roles.includes('hr') && (
                    <button
                      onClick={() => upgradeToHR(user.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded"
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