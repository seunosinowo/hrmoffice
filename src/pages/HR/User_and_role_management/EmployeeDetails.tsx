import React, { useState, useEffect } from 'react';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabase';
import { uploadImage, getDefaultAvatarUrl, checkBucketExists } from '../../../utils/imageUpload';

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

interface NewEmployee {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_ids: string[];
}

const EmployeeDetails: React.FC = () => {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    department_ids: []
  });

  // Function to verify if an image URL is valid
  const verifyImageUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;

    try {
      console.log('Verifying image URL:', url);

      // If the URL is from ui-avatars.com, return it as is
      if (url.includes('ui-avatars.com') || url.includes('default-avatar')) {
        return url;
      }

      // For Supabase URLs, just verify the URL is accessible
      try {
        // Don't add cache-busting parameter for verification
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`URL is accessible: ${url}`);
          return url; // Return the original URL without cache-busting
        } else {
          console.warn(`URL is not accessible: ${url}, status: ${response.status}`);
          return null;
        }
      } catch (fetchError) {
        console.error('Error fetching image for verification:', fetchError);
        return null;
      }
    } catch (error) {
      console.error('Error verifying image URL:', error);
      return null;
    }
  };

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

      // Process employees with verified image URLs
      const formattedEmployees = await Promise.all(employeesData.map(async (emp) => {
        // Verify the profile picture URL
        if (emp.profile_picture_url) {
          console.log(`Original profile picture URL for employee ${emp.id}: ${emp.profile_picture_url}`);
          const verifiedUrl = await verifyImageUrl(emp.profile_picture_url);
          if (verifiedUrl) {
            emp.profile_picture_url = verifiedUrl;
            console.log(`Verified profile picture URL for employee ${emp.id}: ${emp.profile_picture_url}`);
          } else {
            // If verification fails, set to null to show fallback avatar
            emp.profile_picture_url = null;
            console.warn(`Could not verify profile picture URL for employee ${emp.id}, setting to null`);
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

  // Generate employee number
  const generateEmployeeNumber = () => {
    const prefix = 'EMP';
    // Get current time in WAT (UTC+1)
    const now = new Date();
    const watTime = new Date(now.getTime() + (1 * 60 * 60 * 1000)); //  WAT
    const timestamp = watTime.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
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

  // Add employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate that an image is uploaded (required)
    if (!avatarFile) {
      setError('Profile picture is required');
      setIsSubmitting(false);
      return;
    }

    try {
      // First, check if the profile_pictures bucket exists
      const bucketExists = await checkBucketExists('profile_pictures');
      if (!bucketExists) {
        setError('Storage bucket not available. Please contact the administrator.');
        setIsSubmitting(false);
        return;
      }

      // Upload profile picture first to ensure it works
      console.log('Uploading profile picture...');
      const uploadedUrl = await uploadImage(avatarFile, 'profile_pictures');

      if (!uploadedUrl) {
        setError('Failed to upload profile picture. Please try again.');
        setIsSubmitting(false);
        return;
      }

      console.log('Profile picture uploaded successfully:', uploadedUrl);

      // Now create the employee with the uploaded profile picture URL
      const employeeNumber = generateEmployeeNumber();

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert([{
          employee_number: employeeNumber,
          username: newEmployee.username,
          first_name: newEmployee.first_name,
          last_name: newEmployee.last_name,
          email: newEmployee.email,
          phone_number: newEmployee.phone_number,
          profile_picture_url: uploadedUrl // Set the profile picture URL directly
        }])
        .select()
        .single();

      if (employeeError) throw employeeError;

      // Add department associations
      if (newEmployee.department_ids.length > 0) {
        const departmentAssociations = newEmployee.department_ids.map(deptId => ({
          employee_id: employeeData.id,
          department_id: deptId
        }));

        const { error: deptError } = await supabase
          .from('employee_departments')
          .insert(departmentAssociations);

        if (deptError) throw deptError;
      }

      // Refresh the employee list
      await fetchEmployees();
      setShowAddModal(false);
      setNewEmployee({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        department_ids: []
      });
      setAvatarFile(null);
    } catch (error) {
      console.error('Error adding employee:', error);
      setError('Failed to add employee');
    } finally {
      setIsSubmitting(false);
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
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Handle profile picture update first if a new file is selected
      let profilePictureUrl = selectedEmployee.profile_picture_url;

      if (avatarFile) {
        // Check if the profile_pictures bucket exists
        const bucketExists = await checkBucketExists('profile_pictures');
        if (!bucketExists) {
          setError('Storage bucket not available. Please contact the administrator.');
          setIsSubmitting(false);
          return;
        }

        console.log('Uploading new profile picture...');
        const uploadedUrl = await uploadImage(avatarFile, 'profile_pictures');

        if (!uploadedUrl) {
          setError('Failed to upload profile picture. Please try again.');
          setIsSubmitting(false);
          return;
        }

        console.log('Profile picture uploaded successfully:', uploadedUrl);
        profilePictureUrl = uploadedUrl;
      }

      // Update employee details including the profile picture URL
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          username: selectedEmployee.username,
          first_name: selectedEmployee.first_name,
          last_name: selectedEmployee.last_name,
          email: selectedEmployee.email,
          phone_number: selectedEmployee.phone_number,
          profile_picture_url: profilePictureUrl // Always include the profile picture URL
        })
        .eq('id', selectedEmployee.id);

      if (updateError) throw updateError;

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

  // Toggle department selection
  const toggleDepartment = (departmentId: string, isSelected: boolean) => {
    if (isSelected) {
      setNewEmployee(prev => ({
        ...prev,
        department_ids: prev.department_ids.filter(id => id !== departmentId)
      }));
    } else {
      setNewEmployee(prev => ({
        ...prev,
        department_ids: [...prev.department_ids, departmentId]
      }));
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Employee Details
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <UserIcon className="w-4 h-4" />
          Add Employee
        </button>
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
                  <div className="flex items-center space-x-6">
                    <div className="relative h-24 w-24">
                      {employee.profile_picture_url ? (
                        <img
                          src={`${employee.profile_picture_url}?t=${Date.now()}`}
                          alt={`${employee.first_name} ${employee.last_name}`}
                          className="h-full w-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Error loading image:', employee.profile_picture_url);
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
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Add New Employee</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleAddEmployee} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    name="username"
                    type="text"
                    value={newEmployee.username}
                    onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
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
                      value={newEmployee.first_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
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
                      value={newEmployee.last_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
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
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
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
                    value={newEmployee.phone_number}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone_number: e.target.value })}
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
                      <div key={`dept-checkbox-${dept.id}`} className="flex items-center py-1">
                        <input
                          type="checkbox"
                          id={`dept-${dept.id}`}
                          checked={newEmployee.department_ids.includes(dept.id)}
                          onChange={() => toggleDepartment(dept.id, newEmployee.department_ids.includes(dept.id))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`dept-${dept.id}`} className="ml-2 block text-sm text-gray-900 dark:text-white">
                          {dept.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Picture <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className={`flex items-center justify-center w-full h-32 px-4 transition ${!avatarFile ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700`}>
                      <div className="flex flex-col items-center space-y-2">
                        {avatarFile ? (
                          <div className="relative w-20 h-20">
                            <img
                              src={URL.createObjectURL(avatarFile)}
                              alt="Preview"
                              className="w-full h-full rounded-full object-cover"
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
                        ) : (
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {avatarFile ? 'Change image' : 'Click to upload or drag and drop (Required)'}
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
                        required
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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
                    {isSubmitting ? 'Adding...' : 'Add Employee'}
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
                  <div className="relative w-24 h-24">
                    {selectedEmployee.profile_picture_url ? (
                      <img
                        src={`${selectedEmployee.profile_picture_url}?t=${Date.now()}`}
                        alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                        className="w-full h-full rounded-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.error('Error loading image:', selectedEmployee.profile_picture_url);
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
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
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
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
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
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
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
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
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
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
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
                              src={`${selectedEmployee.profile_picture_url}?t=${Date.now()}`}
                              alt="Current"
                              className="w-full h-full rounded-full object-cover"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error('Error loading image:', selectedEmployee.profile_picture_url);
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