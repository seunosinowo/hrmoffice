import React, { useState, useEffect } from 'react';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabase';

// interfaces
interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  employee_number: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_ids: string[];
  profile_picture_url: string | null;
  departments: Department[];
}

const EmployeeDetails: React.FC = () => {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  // Fetch employees with their departments
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          employee_departments (
            department:departments (
              id,
              name
            )
          )
        `)
        .order('employee_number', { ascending: true });

      if (employeesError) throw employeesError;

      // Process employees with verified image URLs more efficiently
      const formattedEmployees = await Promise.all(employeesData.map(async (emp) => {
        // Only verify image URL if it exists and isn't a default avatar
        if (emp.profile_picture_url && !emp.profile_picture_url.includes('ui-avatars.com') && !emp.profile_picture_url.includes('default-avatar')) {
          try {
            const response = await fetch(emp.profile_picture_url, { method: 'HEAD' });
            if (!response.ok) {
              emp.profile_picture_url = null;
            }
          } catch (error) {
            emp.profile_picture_url = null;
          }
        }

        return {
          ...emp,
          departments: emp.employee_departments.map((ed: any) => ed.department),
          department_ids: emp.employee_departments.map((ed: any) => ed.department.id)
        };
      }));

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const { error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // View employee function
  const handleViewEmployee = (employeeId: string) => {
    const employeeToView = employees.find(emp => emp.id === employeeId);
    if (employeeToView) {
      setSelectedEmployee(employeeToView);
      setShowViewModal(true);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Employee Details
        </h2>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Employee Grid - Horizontal Cards */
        <div className="grid grid-cols-1 gap-6">
          {employees.map((employee) => (
            <div key={`employee-${employee.id}-${employee.employee_number}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 w-full">
                    <div className="relative h-24 w-24 flex-shrink-0">
                      {employee.profile_picture_url ? (
                        <img
                          src={`${employee.profile_picture_url}?t=${Date.now()}`}
                          alt={`${employee.first_name} ${employee.last_name}`}
                          className="h-full w-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }

                            // Update the employee object to use null for profile_picture_url
                            setEmployees(prevEmployees =>
                              prevEmployees.map(emp =>
                                emp.id === employee.id ? {...emp, profile_picture_url: null} : emp
                              )
                            );
                          }}
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                          <UserIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {/* Fallback avatar that shows when image fails to load */}
                      <div className="fallback-avatar absolute inset-0 w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700" style={{ display: 'none' }}>
                        <UserIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center space-x-4 md:space-x-8 w-full">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {employee.employee_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {employee.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {employee.phone_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Departments</p>
                        <div className="flex flex-wrap gap-1 mt-1 max-w-[300px]">
                          {employee.departments.map((dept) => (
                            <span
                              key={`employee-dept-${dept.id}-${employee.id}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-normal break-words"
                            >
                              {dept.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleViewEmployee(employee.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh]">
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-2rem)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Employee Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    {selectedEmployee.profile_picture_url ? (
                      <img
                        src={`${selectedEmployee.profile_picture_url}?t=${Date.now()}`}
                        alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                        className="w-full h-full rounded-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }

                          // Update the selectedEmployee object to use null for profile_picture_url
                          setSelectedEmployee({
                            ...selectedEmployee,
                            profile_picture_url: null
                          });
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {/* Fallback avatar that shows when image fails to load */}
                    <div className="fallback-avatar absolute inset-0 w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center" style={{ display: 'none' }}>
                      <UserIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Employee Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedEmployee.employee_number}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Username
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedEmployee.username}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      First Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedEmployee.first_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedEmployee.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedEmployee.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Phone Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedEmployee.phone_number}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Departments
                    </label>
                    <div className="flex flex-wrap gap-2 max-w-[400px]">
                      {departmentsLoading ? (
                        <div className="flex justify-center items-center py-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        </div>
                      ) : selectedEmployee.departments && selectedEmployee.departments.length > 0 ? (
                        selectedEmployee.departments.map(dept => (
                          <span
                            key={`view-dept-${dept.id}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-normal break-words"
                          >
                            {dept.name}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No departments assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDetails;