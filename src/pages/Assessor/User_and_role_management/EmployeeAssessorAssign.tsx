import { supabase } from '../../../lib/supabase';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  UserIcon,
  InfoIcon
} from "../../../icons";

interface AssessorAssignment {
  id: number;
  employee_name: string;
  department: string;
  job_role: string;
  assessor: string;
  created_at: string;
}

export default function EmployeeAssessorAssign() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssessorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('You must be logged in to view your assigned employees');
        setLoading(false);
        return;
      }

      // First, get the assessor record from the assessors table
      const { data: assessorData, error: assessorError } = await supabase
        .from('assessors')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (assessorError) {
        console.error("Error fetching assessor profile:", assessorError);

        // If no record in assessors table, try the employees table as fallback
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (employeeError) {
          console.error("Error fetching employee profile:", employeeError);
          if (employeeError.code === 'PGRST116') {
            // No profile found
            setError('Please contact HR to set up your assessor account.');
          } else {
            setError('Unable to access your assessor information. Please contact HR.');
          }
          setLoading(false);
          return;
        }

        // Construct the assessor's full name from employee data
        const assessorFullName = `${employeeData.first_name} ${employeeData.last_name}`;
        console.log("Using employee data for assessor name:", assessorFullName);
        return assessorFullName;
      }

      // Construct the assessor's full name from assessor data
      const assessorFullName = `${assessorData.first_name} ${assessorData.last_name}`;
      console.log("Using assessor data for assessor name:", assessorFullName);

      // Then fetch assignments where this assessor is assigned by name
      const { data, error } = await supabase
        .from('employee_assessor_assignments')
        .select('*')
        .eq('assessor', assessorFullName)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching assignments:", error);
        throw error;
      }

      setAssignments(data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError('Failed to load assessor assignments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter assignments based on search term
  const filteredAssignments = assignments.filter(assignment =>
    assignment.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.job_role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">My Assigned Employees</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">View employees assigned to you for assessment</p>
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
          placeholder="Search by employee, department, or job role..."
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
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/20">
          <div className="flex items-center">
            <UserIcon className="size-5 text-blue-600 dark:text-blue-400 mr-3" />
            <p className="text-gray-700 dark:text-gray-300">{error}</p>
          </div>
          <button
            onClick={fetchAssignments}
            className="mt-3 rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40"
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
                    Assignment Date
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
                      {new Date(assignment.created_at).toLocaleDateString()}
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No assigned employees found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'You have no employees assigned to you yet'}
          </p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Contact HR to have employees assigned to you
          </p>
        </div>
      )}
    </div>
  );
}