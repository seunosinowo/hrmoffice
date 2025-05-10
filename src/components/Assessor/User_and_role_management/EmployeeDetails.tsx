import React, { useState, useEffect } from 'react';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabase';
import { uploadProfilePicture, getDefaultAvatarUrl } from '../../../utils/imageUpload';
import { useAuth } from '../../../context/AuthContext';

// interfaces
interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  user_id: string;
  employee_number: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_ids: string[];
  profile_picture_url: string | null;
  departments: Department[];
  edit_locked_until: string | null;
  last_edited_by: string | null;
}



const EmployeeDetails: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssessModal, setShowAssessModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentNotes, setAssessmentNotes] = useState('');

  // Fetch all employees with their departments
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

      const formattedEmployees = employeesData.map(emp => {
        // If the profile picture URL exists, make sure it's properly formatted
        let profilePictureUrl = emp.profile_picture_url;

        if (profilePictureUrl) {
          // Add a timestamp to prevent caching if not already present
          if (!profilePictureUrl.includes('?')) {
            profilePictureUrl = `${profilePictureUrl}?t=${Date.now()}`;
            console.log(`Added cache-busting parameter: ${profilePictureUrl}`);
          }
        }

        return {
          ...emp,
          departments: emp.employee_departments.map((ed: any) => ed.department),
          department_ids: emp.employee_departments.map((ed: any) => ed.department.id),
          profile_picture_url: profilePictureUrl
        };
      });

      console.log('Fetched employees (Assessor view):', formattedEmployees);
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
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
    }
  };

  // Handle file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setAvatarFile(file);
  };



  // View employee function
  const handleViewEmployee = (employeeId: string) => {
    const employeeToView = employees.find(emp => emp.id === employeeId);
    if (employeeToView) {
      setSelectedEmployee(employeeToView);
      setShowViewModal(true);
    }
  };

  // Edit employee function
  const handleEditEmployee = (employeeId: string) => {
    const employeeToEdit = employees.find(emp => emp.id === employeeId);
    if (employeeToEdit) {
      setSelectedEmployee(employeeToEdit);
      setShowEditModal(true);
    }
  };

  // Update employee
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Update employee details
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          username: selectedEmployee.username,
          first_name: selectedEmployee.first_name,
          last_name: selectedEmployee.last_name,
          email: selectedEmployee.email,
          phone_number: selectedEmployee.phone_number,
          last_edited_by: user.id,
          // Assessors can update without triggering the 24-hour lock
          // The database trigger will still set edit_locked_until, but we don't enforce it for Assessors
        })
        .eq('id', selectedEmployee.id);

      if (updateError) throw updateError;

      // Handle profile picture update
      if (avatarFile) {
        console.log('Assessor: Uploading new profile picture...');
        const uploadedUrl = await uploadProfilePicture(avatarFile, selectedEmployee.id);

        if (uploadedUrl) {
          console.log('Assessor: Profile picture uploaded successfully, updating employee record with new URL:', uploadedUrl);

          const { data: updateData, error: pictureUpdateError } = await supabase
            .from('employees')
            .update({ profile_picture_url: uploadedUrl })
            .eq('id', selectedEmployee.id)
            .select();

          if (pictureUpdateError) {
            console.error('Assessor: Error updating profile picture URL in database:', pictureUpdateError);
            setError('Failed to update profile picture URL in database');
          } else {
            console.log('Assessor: Profile picture URL updated successfully in database:', updateData);
          }
        } else {
          console.error('Assessor: Failed to upload profile picture');
          setError('Failed to upload profile picture');
        }
      }

      // Update department associations
      await supabase
        .from('employee_departments')
        .delete()
        .eq('employee_id', selectedEmployee.id);

      if (selectedEmployee.department_ids.length > 0) {
        const departmentAssociations = selectedEmployee.department_ids.map(deptId => ({
          employee_id: selectedEmployee.id,
          department_id: deptId
        }));

        const { error: deptError } = await supabase
          .from('employee_departments')
          .insert(departmentAssociations);

        if (deptError) throw deptError;
      }

      await fetchEmployees();
      setShowEditModal(false);
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating employee:', error);
      setError('Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create assessment for employee
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Create assessment record
      const { error: assessmentError } = await supabase
        .from('employee_assessments')
        .insert([{
          employee_id: selectedEmployee.id,
          assessor_id: user.id,
          assessment_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          notes: assessmentNotes
        }]);

      if (assessmentError) throw assessmentError;

      setShowAssessModal(false);
      setAssessmentNotes('');

      // Show success message
      alert('Assessment submitted successfully');
    } catch (error) {
      console.error('Error creating assessment:', error);
      setError('Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };



  // Toggle department selection for edit
  const toggleDepartmentEdit = (departmentId: string, isSelected: boolean) => {
    if (!selectedEmployee) return;

    if (isSelected) {
      setSelectedEmployee({
        ...selectedEmployee,
        department_ids: selectedEmployee.department_ids.filter(id => id !== departmentId)
      });
    } else {
      setSelectedEmployee({
        ...selectedEmployee,
        department_ids: [...selectedEmployee.department_ids, departmentId]
      });
    }
  };

  // Initialize data
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Employee Management (Assessor View)
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          As an assessor, you can view, edit, and assess all employee profiles
        </div>
      </div>

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
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <img
                        src={employee.profile_picture_url || getDefaultAvatarUrl(employee.first_name, employee.last_name)}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                        onLoad={() => console.log(`Assessor: Image loaded successfully for employee ${employee.id}`)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error(`Assessor: Image load error for employee ${employee.id}. URL: ${employee.profile_picture_url}`);
                          target.src = getDefaultAvatarUrl(employee.first_name, employee.last_name);
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-8">
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
                        <div className="flex flex-wrap gap-1 mt-1">
                          {employee.departments.map((dept) => (
                            <span
                              key={`employee-dept-${dept.id}-${employee.id}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
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
                    <button
                      onClick={() => handleEditEmployee(employee.id)}
                      className="text-sm font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowAssessModal(true);
                      }}
                      className="text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Assess
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assessment Modal */}
      {showAssessModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Assess Employee: {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h3>
                <button
                  onClick={() => setShowAssessModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAssessment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assessment Notes
                  </label>
                  <textarea
                    rows={6}
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Enter your assessment notes here..."
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAssessModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="p-6">
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
                  {selectedEmployee.profile_picture_url ? (
                    <div className="relative">
                      <img
                        src={selectedEmployee.profile_picture_url}
                        alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900 filter drop-shadow-lg"
                        onLoad={() => console.log(`Assessor View modal: Image loaded successfully for employee ${selectedEmployee.id}`)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error(`Assessor View modal: Image load error for employee ${selectedEmployee.id}. URL: ${selectedEmployee.profile_picture_url}`);
                          target.src = getDefaultAvatarUrl(selectedEmployee.first_name, selectedEmployee.last_name);
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (selectedEmployee.profile_picture_url) {
                            window.open(selectedEmployee.profile_picture_url, '_blank');
                          }
                        }}
                        className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1.5"
                        title="View full image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-4 border-blue-100 dark:border-blue-900 filter drop-shadow-lg">
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                      </span>
                    </div>
                  )}
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
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Departments
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedEmployee.departments.map(dept => dept.name).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Employee
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee Number
                  </label>
                  <input
                    type="text"
                    value={selectedEmployee.employee_number}
                    disabled
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    name="username"
                    type="text"
                    value={selectedEmployee.username}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, username: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      name="first_name"
                      type="text"
                      value={selectedEmployee.first_name}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, first_name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      name="last_name"
                      type="text"
                      value={selectedEmployee.last_name}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, last_name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={selectedEmployee.email}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone_number"
                    type="tel"
                    value={selectedEmployee.phone_number}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, phone_number: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Departments
                  </label>
                  <div className="mt-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md p-2 max-h-40 overflow-y-auto">
                    {departments.map((dept) => (
                      <div key={`edit-dept-checkbox-${dept.id}`} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          id={`edit-dept-${dept.id}`}
                          checked={selectedEmployee.department_ids.includes(dept.id)}
                          onChange={() => toggleDepartmentEdit(dept.id, selectedEmployee.department_ids.includes(dept.id))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`edit-dept-${dept.id}`} className="ml-2 block text-sm text-gray-900 dark:text-white">
                          {dept.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Picture
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                      <div className="flex flex-col items-center space-y-2">
                        {avatarFile ? (
                          <div className="relative w-20 h-20">
                            <img
                              src={URL.createObjectURL(avatarFile)}
                              alt="Preview"
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = getDefaultAvatarUrl();
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setAvatarFile(null);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : selectedEmployee.profile_picture_url ? (
                          <div className="relative w-20 h-20">
                            <img
                              src={selectedEmployee.profile_picture_url}
                              alt="Current"
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = getDefaultAvatarUrl();
                              }}
                            />
                          </div>
                        ) : (
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {avatarFile ? 'Change image' : 'Click to upload or drag and drop'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          JPG, JPEG, PNG (max. 2MB)
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDetails;