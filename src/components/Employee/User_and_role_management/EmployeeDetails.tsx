import React, { useState, useEffect } from 'react';
import { UserIcon, XMarkIcon, ClockIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
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
  // Get current user from auth context
  const { user } = useAuth();

  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [timeUntilEditable, setTimeUntilEditable] = useState<string | null>(null);

  // New employee state (for creating profile)
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    username: '',
    first_name: '',
    last_name: '',
    email: user?.email || '',
    phone_number: '',
    department_ids: []
  });

  // Fetch employee profile for current user
  const fetchEmployeeProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Try to fetch employee profile using user_id first (preferred method)
      const { data: userIdData, error: userIdError } = await supabase
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
        .eq('user_id', user.id)
        .order('employee_number', { ascending: true });

      // If no results or error, try using email as fallback
      let employeesData;
      let employeesError;

      if (userIdError || !userIdData || userIdData.length === 0) {
        console.log('No profile found with user_id, trying email fallback');

        const { data: emailData, error: emailError } = await supabase
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
          .eq('email', user.email)
          .order('employee_number', { ascending: true });

        employeesData = emailData;
        employeesError = emailError;

        // If we found a profile by email but it doesn't have user_id set,
        // update it to link to the current user
        if (emailData && emailData.length > 0 && (!emailData[0].user_id || emailData[0].user_id !== user.id)) {
          console.log('Updating employee profile to link with user account');

          const { error: updateError } = await supabase
            .from('employees')
            .update({ user_id: user.id })
            .eq('id', emailData[0].id);

          if (updateError) {
            console.error('Error updating user_id:', updateError);
          }
        }
      } else {
        employeesData = userIdData;
        employeesError = userIdError;
      }

      if (employeesError) throw employeesError;

      if (employeesData && employeesData.length > 0) {
        console.log('Employee profile found:', employeesData);
        // Log the raw employee data to see what's coming from the database
        console.log('Raw employee data from database:', employeesData);

        const formattedEmployees = employeesData.map(emp => {
          // Log each employee's profile picture URL
          console.log(`Employee ${emp.id} profile_picture_url:`, emp.profile_picture_url);

          // If the profile picture URL exists, make sure it's properly formatted
          let profilePictureUrl = emp.profile_picture_url;

          if (profilePictureUrl) {
            // Log the original URL
            console.log(`Original profile picture URL: ${profilePictureUrl}`);

            // Add a timestamp to prevent caching if not already present
            if (!profilePictureUrl.includes('?')) {
              profilePictureUrl = `${profilePictureUrl}?t=${Date.now()}`;
              console.log(`Added cache-busting parameter: ${profilePictureUrl}`);
            }

            // Test if the image is accessible
            fetch(profilePictureUrl, { method: 'HEAD' })
              .then(response => {
                console.log(`Image URL test response: ${response.status} ${response.statusText}`);
              })
              .catch(error => {
                console.error('Error testing image URL:', error);
              });
          }

          return {
            ...emp,
            departments: emp.employee_departments.map((ed: any) => ed.department),
            department_ids: emp.employee_departments.map((ed: any) => ed.department.id),
            // Use the potentially modified profile picture URL
            profile_picture_url: profilePictureUrl
          };
        });

        setEmployees(formattedEmployees);
        setProfileExists(true);
        console.log('Profile exists set to TRUE');

        // Check if employee can edit their profile (not locked)
        // Simplified logic - check if profile is older than 12 hours
        const now = new Date();
        const creationTime = new Date(formattedEmployees[0].created_at);
        const twelveHoursAfterCreation = new Date(creationTime.getTime() + 12 * 60 * 60 * 1000);

        // If current time is before the 12-hour window expires
        if (now < twelveHoursAfterCreation) {
          setCanEdit(true);

          // Calculate time remaining until profile is locked permanently
          const timeRemaining = Math.floor((twelveHoursAfterCreation.getTime() - now.getTime()) / 1000);
          const hours = Math.floor(timeRemaining / 3600);
          const minutes = Math.floor((timeRemaining % 3600) / 60);

          setTimeUntilEditable(`${hours}h ${minutes}m`);
        } else {
          // After 12 hours, profile is permanently locked for employee
          setCanEdit(false);
          setTimeUntilEditable(null);
        }
      } else {
        console.log('No employee profile found');
        setProfileExists(false);
        setCanEdit(true);
        console.log('Profile exists set to FALSE');
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      setError('Failed to load employee profile');
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
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log(`File selected: ${file.name}, size: ${file.size}bytes, type: ${file.type}`);

    if (file.size > 2 * 1024 * 1024) {
      console.error(`File size too large: ${file.size}bytes (max: 2MB)`);
      setError('File size must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type} (allowed: ${allowedTypes.join(', ')})`);
      setError('File type must be JPEG, JPG, or PNG');
      return;
    }

    console.log('File validation passed, setting avatar file');
    setAvatarFile(file);
  };

  // Create employee profile
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const employeeNumber = generateEmployeeNumber();

      // First, create the employee with default avatar
      // Set edit_locked_until to 12 hours from now
      const now = new Date();
      const lockUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

      // Create employee data object with all required fields
      const employeeData: any = {
        employee_number: employeeNumber,
        username: newEmployee.username,
        first_name: newEmployee.first_name,
        last_name: newEmployee.last_name,
        email: newEmployee.email || user.email,
        phone_number: newEmployee.phone_number,
        profile_picture_url: getDefaultAvatarUrl(newEmployee.first_name, newEmployee.last_name),
        user_id: user.id, // Always set user_id to link profile to user account
        edit_locked_until: lockUntil.toISOString() // Always set edit_locked_until for 24-hour editing restriction
      };

      const { data: createdEmployee, error: employeeError } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      console.log('Created employee with lock until:', lockUntil);

      if (employeeError) throw employeeError;

      // Use the returned data from the insert operation
      const newEmployeeData = createdEmployee;

      if (!newEmployeeData) {
        throw new Error('Failed to create employee profile');
      }

      // Upload profile picture if provided
      if (avatarFile && newEmployeeData) {
        console.log('Uploading profile picture for new employee...');
        const uploadedUrl = await uploadProfilePicture(avatarFile, newEmployeeData.id);

        if (uploadedUrl) {
          console.log('Profile picture uploaded successfully, updating employee record with URL:', uploadedUrl);

          // Update employee with new profile picture URL
          const { data: updateData, error: updateError } = await supabase
            .from('employees')
            .update({ profile_picture_url: uploadedUrl })
            .eq('id', newEmployeeData.id)
            .select();

          if (updateError) {
            console.error('Error updating profile picture URL in database:', updateError);
            throw updateError;
          } else {
            console.log('Profile picture URL updated successfully in database:', updateData);
          }
        } else {
          console.error('Failed to upload profile picture for new employee');
          setError('Failed to upload profile picture');
        }
      }

      // Add department associations
      if (newEmployee.department_ids.length > 0) {
        const departmentAssociations = newEmployee.department_ids.map(deptId => ({
          employee_id: newEmployeeData.id,
          department_id: deptId
        }));

        const { error: deptError } = await supabase
          .from('employee_departments')
          .insert(departmentAssociations);

        if (deptError) throw deptError;
      }

      // Refresh the employee profile
      await fetchEmployeeProfile();
      setNewEmployee({
        username: '',
        first_name: '',
        last_name: '',
        email: user.email || '',
        phone_number: '',
        department_ids: []
      });
      setAvatarFile(null);
      setProfileExists(true);
      console.log('Profile exists set to TRUE after creation');

      // Show success message
      setError(null);
      setJustCreated(true);

      // Use a timeout to scroll to the profile view after a short delay
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (error) {
      console.error('Error creating profile:', error);
      setError('Failed to create profile');
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
      // Set edit_locked_until to 12 hours from now
      const now = new Date();
      const lockUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

      // Create update data object with all required fields
      const updateData = {
        username: selectedEmployee.username,
        first_name: selectedEmployee.first_name,
        last_name: selectedEmployee.last_name,
        email: selectedEmployee.email,
        phone_number: selectedEmployee.phone_number,
        edit_locked_until: lockUntil.toISOString(), // Always set edit_locked_until for 24-hour editing restriction
        user_id: user?.id || selectedEmployee.user_id // Ensure user_id is set correctly
      };

      // Update employee details
      const { error: updateError } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', selectedEmployee.id);

      console.log('Updated employee with lock until:', lockUntil);

      if (updateError) throw updateError;

      // Handle profile picture update
      if (avatarFile) {
        console.log('Uploading new profile picture...');
        const uploadedUrl = await uploadProfilePicture(avatarFile, selectedEmployee.id);

        if (uploadedUrl) {
          console.log('Profile picture uploaded successfully, updating employee record with new URL:', uploadedUrl);

          const { data: updateData, error: pictureUpdateError } = await supabase
            .from('employees')
            .update({ profile_picture_url: uploadedUrl })
            .eq('id', selectedEmployee.id)
            .select();

          if (pictureUpdateError) {
            console.error('Error updating profile picture URL in database:', pictureUpdateError);
            setError('Failed to update profile picture URL in database');
          } else {
            console.log('Profile picture URL updated successfully in database:', updateData);
          }
        } else {
          console.error('Failed to upload profile picture');
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

      await fetchEmployeeProfile();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) {
      fetchEmployeeProfile();
      fetchDepartments();

      // Set up real-time subscription to employee changes
      const employeeSubscription = supabase
        .channel('employee-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employees',
            filter: user.id ? `user_id=eq.${user.id}` : undefined
          },
          (payload) => {
            console.log('Real-time update received for employee:', payload);
            // Refresh the employee profile when changes are detected
            fetchEmployeeProfile();
          }
        )
        .subscribe();

      // Clean up subscription on unmount
      return () => {
        supabase.removeChannel(employeeSubscription);
      };
    }
  }, [user?.id]); // Only re-run if user ID changes

  // State to track if profile was just created
  const [justCreated, setJustCreated] = useState(false);

  // Set justCreated to true when profile is created
  useEffect(() => {
    if (profileExists) {
      setJustCreated(true);
      // Reset after 5 seconds
      const timer = setTimeout(() => {
        setJustCreated(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [profileExists]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {profileExists ? 'My Employee Profile' : 'Create Employee Profile'}
          </h2>
          {profileExists && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your profile was successfully created and is linked to your account
            </p>
          )}
          {!profileExists && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Please create your employee profile to continue
            </p>
          )}
        </div>

        {!profileExists && (
          <button
            onClick={() => window.scrollTo({ top: document.querySelector('.create-profile-form')?.getBoundingClientRect().top || 0, behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <UserIcon className="w-4 h-4" />
            Create Employee Details Profile
          </button>
        )}

        {profileExists && !canEdit && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-300">
            <ClockIcon className="w-4 h-4" />
            Profile locked - Only HR and Assessors can edit
          </div>
        )}

        {profileExists && canEdit && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg dark:bg-green-900/20 dark:text-green-400">
            <ClockIcon className="w-4 h-4" />
            {timeUntilEditable
              ? (
                <span>
                  Profile can be edited <span className="font-bold underline">(locks permanently in {timeUntilEditable})</span>
                </span>
              )
              : 'Profile can be edited'}
          </div>
        )}
      </div>

      {/* Success message after profile creation */}
      {justCreated && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
          <div>
            <p className="font-medium">Profile created successfully!</p>
            <p className="text-sm">You can now view and edit your profile details. Remember, you can only have one profile.</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading indicator, Create Profile Form, or Profile View */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : !profileExists ? (
        /* Create Profile Form */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 create-profile-form">
          <div className="flex items-center mb-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create Your Employee Details Profile
            </h3>
            <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
              One-Time Setup
            </span>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  <strong>Important:</strong> You can only create one employee profile. This profile cannot be deleted by you once created.
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please fill out your employee details below. Note that after creating your profile, you'll only be able to edit it for 12 hours. After that, only Assessors and HR can make changes.
          </p>
          <form onSubmit={handleCreateProfile} className="space-y-6">
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
                readOnly={!!user?.email}
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
                          className="w-full h-full rounded-full object-cover shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getDefaultAvatarUrl(newEmployee.first_name, newEmployee.last_name);
                            console.log(`Preview image load error in create form. Using default avatar with initials.`);
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
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <span className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                          Upload Profile Picture
                        </span>
                      </div>
                    )}
                    <div className="text-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {avatarFile ? 'Change image' : 'Click to upload from your device'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JPG, JPEG, PNG (max. 2MB)
                      </p>
                    </div>
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

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Employee Profile'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Employee Profile View */
        <div className="grid grid-cols-1 gap-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Employee Profile
                </h3>
                <span className="ml-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                  Profile Created
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {!canEdit
                    ? 'Your profile is now permanently locked for editing. Only HR and Assessors can make changes to your profile.'
                    : timeUntilEditable
                      ? (
                        <span>
                          You can edit your profile details for <span className="font-semibold text-orange-600 dark:text-orange-400">{timeUntilEditable}</span> more.
                          After that, your profile will be <span className="font-semibold">permanently locked</span> and only HR and Assessors will be able to make changes.
                        </span>
                      )
                      : 'You can edit your profile details. After 12 hours from creation, your profile will be permanently locked.'}
                </p>
              </div>
            </div>

            {employees.map((employee) => (
              <div key={`employee-${employee.id}-${employee.employee_number}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <div className="relative flex justify-center">
                        {(() => {
                          // Debug the profile picture URL
                          console.log(`Rendering employee ${employee.id} profile picture:`, {
                            hasUrl: !!employee.profile_picture_url,
                            url: employee.profile_picture_url
                          });

                          if (employee.profile_picture_url) {
                            return (
                              <div className="relative">
                                <img
                                  src={employee.profile_picture_url}
                                  alt={`${employee.first_name} ${employee.last_name}`}
                                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-md"
                                  onLoad={() => console.log(`Image loaded successfully for employee ${employee.id}`)}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    console.error(`Image load error for employee ${employee.id}. URL: ${employee.profile_picture_url}`);
                                    target.src = getDefaultAvatarUrl(employee.first_name, employee.last_name);
                                  }}
                                />
                                <div
                                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer"
                                  onClick={() => {
                                    if (employee.profile_picture_url) {
                                      window.open(employee.profile_picture_url, '_blank');
                                    }
                                  }}
                                  title="View full image"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="h-20 w-20 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 border-2 border-gray-200 dark:border-gray-700 shadow-md">
                                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                                </span>
                              </div>
                            );
                          }
                        })()}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="text-center sm:text-left">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {employee.first_name} {employee.last_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.employee_number}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 break-all">
                                {employee.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {employee.phone_number}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Departments</p>
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
                    </div>

                    <div className="flex justify-center mt-4 lg:mt-0 space-x-4">
                      <button
                        onClick={() => handleViewEmployee(employee.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View Details
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleEditEmployee(employee.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh]">
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-2rem)]">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Employee Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center">
                  {selectedEmployee.profile_picture_url ? (
                    <div className="relative">
                      <img
                        src={selectedEmployee.profile_picture_url}
                        alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900 filter drop-shadow-lg"
                        onLoad={() => console.log(`View modal: Image loaded successfully for employee ${selectedEmployee.id}`)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error(`View modal: Image load error for employee ${selectedEmployee.id}. URL: ${selectedEmployee.profile_picture_url}`);
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

                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {selectedEmployee.employee_number}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                    Personal Information
                  </h5>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Username
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedEmployee.username}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Email
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white break-all">
                          {selectedEmployee.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Phone Number
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedEmployee.phone_number}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Edit Status
                      </label>
                      <p className="mt-1 text-sm">
                        {!canEdit ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">Permanently locked</span>
                        ) : timeUntilEditable ? (
                          <span>
                            <span className="text-green-600 dark:text-green-400">Editable</span> -
                            <span className="text-orange-600 dark:text-orange-400 ml-1 font-semibold">
                              Locks in {timeUntilEditable}
                            </span>
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400 font-semibold">Can be edited</span>
                        )}
                      </p>

                      {/* Debug info for profile picture URL */}
                      {selectedEmployee.profile_picture_url && (
                        <div className="mt-2 text-xs text-gray-500 break-all">
                          <p>Image URL: {selectedEmployee.profile_picture_url}</p>
                          <div className="mt-2">
                            <a
                              href={selectedEmployee.profile_picture_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline"
                            >
                              Open image directly
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Departments
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.departments.map(dept => (
                      <span
                        key={`view-dept-${dept.id}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {dept.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditEmployee(selectedEmployee.id);
                      }}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && canEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] border border-gray-200 dark:border-gray-700">
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-2rem)]">
              <div className="flex justify-between items-start mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit Your Profile
                  </h3>
                  <p className="text-sm mt-1">
                    {timeUntilEditable
                      ? (
                        <span className="text-orange-600 dark:text-orange-400">
                          <span className="font-semibold">Time remaining:</span> You can edit your profile for <span className="font-bold">{timeUntilEditable}</span> more.
                          After that, your profile will be <span className="font-bold underline">permanently locked</span>.
                        </span>
                      )
                      : (
                        <span className="text-gray-600 dark:text-gray-400">
                          You can edit your profile now, but after 12 hours from creation, it will be permanently locked.
                        </span>
                      )}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      <strong>Note:</strong> Changes made here will be visible to HR and Assessors.
                    </p>
                  </div>
                </div>
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
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white bg-gray-100"
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
                          <div className="relative w-24 h-24">
                            <img
                              src={URL.createObjectURL(avatarFile)}
                              alt="Preview"
                              className="w-full h-full rounded-full object-cover border-2 border-green-100 dark:border-green-900 filter drop-shadow-md"
                              onLoad={() => console.log(`Edit modal: Preview image loaded successfully`)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.error(`Edit modal: Preview image load error`);
                                target.src = getDefaultAvatarUrl(selectedEmployee.first_name, selectedEmployee.last_name);
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setAvatarFile(null);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : selectedEmployee.profile_picture_url ? (
                          <div className="relative w-24 h-24">
                            <img
                              src={selectedEmployee.profile_picture_url}
                              alt="Current"
                              className="w-full h-full rounded-full object-cover border-2 border-blue-100 dark:border-blue-900 filter drop-shadow-md"
                              onLoad={() => console.log(`Edit modal: Image loaded successfully for employee ${selectedEmployee.id}`)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.error(`Edit modal: Image load error for employee ${selectedEmployee.id}. URL: ${selectedEmployee.profile_picture_url}`);
                                target.src = getDefaultAvatarUrl(selectedEmployee.first_name, selectedEmployee.last_name);
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('Viewing full image in new tab');
                                if (selectedEmployee.profile_picture_url) {
                                  window.open(selectedEmployee.profile_picture_url, '_blank');
                                }
                              }}
                              className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1.5"
                              title="View full image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            <span className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                              Upload New Picture
                            </span>
                          </div>
                        )}
                        <div className="text-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {avatarFile ? 'Change image' : 'Click to upload from your device'}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            JPG, JPEG, PNG (max. 2MB)
                          </p>
                        </div>
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
                    {isSubmitting ? 'Updating...' : 'Save Changes'}
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


