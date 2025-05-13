import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  UserIcon,
  BoxCubeIcon,
  TableIcon,
  GroupIcon
} from "../../../icons";

// Import components
import UsersTab from './components/UsersTab';
import DepartmentsTab from './components/DepartmentsTab';
import JobRolesTab from './components/JobRolesTab';
import AssessorsTab from './components/AssessorsTab';

// Types
interface User {
  id: string;
  email: string;
  roles: string[];
}

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface JobRole {
  id: string;
  name: string;
  description: string | null;
}

interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  departments?: any[];
}

export default function RoleManagement() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'jobRoles' | 'assessors'>('users');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Job roles state
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loadingJobRoles, setLoadingJobRoles] = useState(true);

  // Assessors state
  const [assessors, setAssessors] = useState<Employee[]>([]);



  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchJobRoles();
    fetchAssessors();
  }, []);



  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      // Fetch all users from auth schema
      const { data, error: usersError } = await supabase
        .from('auth_users_view')
        .select('id, email');

      if (usersError) throw usersError;

      const usersData = data || [];

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        usersData.map(async (user) => {
          // Get role assignments for this user
          const { data: roleAssignments } = await supabase
            .from('user_role_assignments')
            .select(`
              roles:role_id (
                id,
                role_name
              )
            `)
            .eq('user_id', user.id);

          // Extract role names
          let roles = roleAssignments
            ? roleAssignments.map((assignment: any) => assignment.roles.role_name)
            : [];

          // If no roles, set as employee by default
          if (roles.length === 0) {
            roles = ['employee'];
          }

          // Ensure only one role is shown, with priority: HR > Assessor > Employee
          let primaryRole = 'employee';
          if (roles.includes('hr')) {
            primaryRole = 'hr';
          } else if (roles.includes('assessor')) {
            primaryRole = 'assessor';
          }

          return { ...user, roles: [primaryRole] };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('id', { ascending: true }); // Order by ID to keep new items at the bottom

      if (error) throw error;

      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch job roles
  const fetchJobRoles = async () => {
    try {
      setLoadingJobRoles(true);

      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .order('id', { ascending: true }); // Order by ID to keep new items at the bottom

      if (error) throw error;

      setJobRoles(data || []);
    } catch (error) {
      console.error('Error fetching job roles:', error);
    } finally {
      setLoadingJobRoles(false);
    }
  };

  // Fetch assessors
  const fetchAssessors = async () => {
    try {
      // Fetch directly from the assessors table
      const { data: assessorsData, error: assessorsError } = await supabase
        .from('assessors')
        .select(`
          id,
          user_id,
          employee_id,
          first_name,
          last_name,
          email,
          created_at
        `)
        .order('first_name', { ascending: true });

      if (assessorsError) throw assessorsError;

      if (!assessorsData || assessorsData.length === 0) {
        console.log('No assessors found in the assessors table');
        setAssessors([]);
        return;
      }

      console.log('Found assessors:', assessorsData);

      // Get department information for assessors who have employee profiles
      const assessorIds = assessorsData
        .filter(a => a.employee_id)
        .map(a => a.employee_id);

      let departmentsData: any[] = [];

      if (assessorIds.length > 0) {
        const { data: empDeptData, error: deptError } = await supabase
          .from('employee_departments')
          .select(`
            employee_id,
            department:departments (
              id,
              name
            )
          `)
          .in('employee_id', assessorIds);

        if (!deptError && empDeptData) {
          departmentsData = empDeptData;
        }
      }

      // Format the assessors with department information
      const formattedAssessors = assessorsData.map(assessor => {
        const assessorDepts = departmentsData
          .filter(d => d.employee_id === assessor.employee_id)
          .map(d => d.department);

        return {
          ...assessor,
          departments: assessorDepts
        };
      });

      setAssessors(formattedAssessors);
    } catch (error) {
      console.error('Error fetching assessors:', error);
    }
  };



  if (loadingUsers && loadingDepartments && loadingJobRoles) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="size-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Role Management</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage users, departments, job roles, and assessors</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-300">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center justify-center p-4 rounded-t-lg ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-white dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-white'
              }`}
            >
              <UserIcon className="mr-2 size-5" />
              Users
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('departments')}
              className={`inline-flex items-center justify-center p-4 rounded-t-lg ${
                activeTab === 'departments'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-white dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-white'
              }`}
            >
              <BoxCubeIcon className="mr-2 size-5" />
              Departments
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('jobRoles')}
              className={`inline-flex items-center justify-center p-4 rounded-t-lg ${
                activeTab === 'jobRoles'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-white dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-white'
              }`}
            >
              <TableIcon className="mr-2 size-5" />
              Job Roles
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setActiveTab('assessors');
              }}
              className={`inline-flex items-center justify-center p-4 rounded-t-lg ${
                activeTab === 'assessors'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-white dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-white'
              }`}
            >
              <GroupIcon className="mr-2 size-5" />
              Assessors
            </button>
          </li>
        </ul>
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <UsersTab
          users={users}
          loadingUsers={loadingUsers}
          fetchUsers={fetchUsers}
          fetchAssessors={fetchAssessors}
          setUsers={setUsers} // Pass the setUsers function to allow immediate UI updates
        />
      )}

      {/* Departments Tab Content */}
      {activeTab === 'departments' && (
        <DepartmentsTab
          departments={departments}
          loadingDepartments={loadingDepartments}
          fetchDepartments={fetchDepartments}
          setDepartments={setDepartments} // Pass the setDepartments function to allow immediate UI updates
        />
      )}

      {/* Job Roles Tab Content */}
      {activeTab === 'jobRoles' && (
        <JobRolesTab
          jobRoles={jobRoles}
          loadingJobRoles={loadingJobRoles}
          fetchJobRoles={fetchJobRoles}
          setJobRoles={setJobRoles} // Pass the setJobRoles function to allow immediate UI updates
        />
      )}

      {/* Assessors Tab Content */}
      {activeTab === 'assessors' && (
        <AssessorsTab
          assessors={assessors}
          fetchAssessors={fetchAssessors}
          fetchUsers={fetchUsers}
        />
      )}
    </div>
  );
}
