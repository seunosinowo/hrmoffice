import React, { useState, useEffect } from 'react';
import { UserIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { uploadImage, checkBucketExists, getFileUrl } from '../../utils/imageUpload';

// Add a type for our user
interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: string;
  profile_picture_url: string | null;
  department: Department;
}

interface NewUser {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    department_id: ''
  });

  useEffect(() => {
    const initialize = async () => {
      await fetchUsers();
      await fetchDepartments();
      
      // Check if the profile_pictures bucket exists
      const bucketExists = await checkBucketExists('profile_pictures');
      if (!bucketExists) {
        console.warn('The profile_pictures bucket does not exist. Please create it in the Supabase dashboard.');
        // We'll continue without the bucket for now
      }
    };
    
    initialize();
  }, []);

  // Function to verify if an image URL is valid
  const verifyImageUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    
    try {
      console.log('Verifying image URL:', url);
      
      // Extract the filename from the URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Check if the file exists in the bucket
      const verifiedUrl = await getFileUrl('profile_pictures', fileName);
      if (verifiedUrl) {
        console.log(`Verified URL for ${fileName}: ${verifiedUrl}`);
        
        // Additional verification by trying to fetch the image
        try {
          const response = await fetch(verifiedUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`URL is accessible: ${verifiedUrl}`);
            // Add cache-busting parameter to the URL
            const cacheBustUrl = `${verifiedUrl}?t=${Date.now()}`;
            return cacheBustUrl;
          } else {
            console.warn(`URL is not accessible: ${verifiedUrl}, status: ${response.status}`);
            return null;
          }
        } catch (fetchError) {
          console.error('Error fetching image for verification:', fetchError);
          return null;
        }
      } else {
        console.warn(`Could not verify URL for ${fileName}`);
        return null;
      }
    } catch (error) {
      console.error('Error verifying image URL:', error);
      return null;
    }
  };

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          first_name,
          last_name,
          email,
          phone_number,
          department_id,
          profile_picture_url,
          departments (
            id,
            name
          )
        `);
      
      if (error) {
        throw error;
      }
      
      // Verify profile picture URLs
      const usersWithVerifiedUrls = await Promise.all(
        data.map(async (user) => {
          if (user.profile_picture_url) {
            const verifiedUrl = await verifyImageUrl(user.profile_picture_url);
            if (verifiedUrl) {
              user.profile_picture_url = verifiedUrl;
            } else {
              // If verification fails, set to null to show fallback avatar
              user.profile_picture_url = null;
            }
          }
          
          // Transform the data to match our User interface
          let departmentData: Department = { id: '', name: 'No Department' };
          
          if (user.departments) {
            if (Array.isArray(user.departments) && user.departments.length > 0) {
              const firstDepartment = user.departments[0] as unknown as Department;
              departmentData = {
                id: firstDepartment.id || '',
                name: firstDepartment.name || 'No Department'
              };
            } else if (typeof user.departments === 'object' && user.departments !== null) {
              const department = user.departments as unknown as Department;
              departmentData = {
                id: department.id || '',
                name: department.name || 'No Department'
              };
            }
          }
          
          return {
            id: user.id || '',
            username: user.username || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            department_id: user.department_id || '',
            profile_picture_url: user.profile_picture_url,
            department: departmentData
          };
        })
      );
      
      setUsers(usersWithVerifiedUrls);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments from Supabase
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  // Handle file change for profile picture
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.log('File selected:', file.name, file.size, file.type);
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        console.error('File size must be less than 2MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        console.error('File type must be JPEG, JPG, or PNG');
        return;
      }

      // Create a new file with a standardized name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const newFileName = `${Date.now()}.${fileExt}`;
      const newFile = new File([file], newFileName, { type: file.type });

      // Upload the file
      const imageUrl = await uploadImage(newFile, 'profile_pictures');
      if (!imageUrl) {
        console.error('Failed to upload image');
        return;
      }

      // Verify the image URL is accessible
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`Image URL verification failed: ${response.status} ${response.statusText}`);
          return;
        }
        console.log('Image URL verified:', imageUrl);
      } catch (error) {
        console.error('Error verifying image URL:', error);
        return;
      }

      setNewUser(prev => ({ ...prev, profilePicture: imageUrl }));
    } catch (error) {
      console.error('Error handling file:', error);
    }
  };

  // Add user function with Supabase integration
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!newUser.username || !newUser.first_name || !newUser.last_name || !newUser.email || !newUser.phone_number || !newUser.department_id) {
      alert('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      let avatarUrl = null;
      
      // Handle profile picture upload if a file was selected
      if (avatarFile) {
        try {
          // Check if the bucket exists before trying to upload
          const bucketExists = await checkBucketExists('profile_pictures');
          if (!bucketExists) {
            console.warn('Cannot upload profile picture: The profile_pictures bucket does not exist.');
          } else {
            console.log('Uploading file:', avatarFile.name, 'Size:', avatarFile.size, 'Type:', avatarFile.type);
            avatarUrl = await uploadImage(avatarFile, 'profile_pictures');
            console.log('Uploaded image URL:', avatarUrl);
            if (!avatarUrl) {
              console.warn('Failed to upload profile picture. Continuing without it.');
            }
          }
        } catch (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          // Continue without the profile picture
        }
      }
      
      // Create user in Supabase
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username: newUser.username,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email,
            phone_number: newUser.phone_number,
            department_id: newUser.department_id,
            profile_picture_url: avatarUrl
          }
        ])
        .select(`
          id,
          username,
          first_name,
          last_name,
          email,
          phone_number,
          department_id,
          profile_picture_url,
          departments (
            id,
            name
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          setError('Username already exists. Please choose a different username.');
        } else {
          console.error('Error adding user:', error);
          setError('Error adding user. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }
      
      // Transform the data to match our User interface
      const userData = data as any;
      
      // Extract department data safely
      let departmentData = { id: '', name: 'No Department' };
      
      if (userData.departments) {
        if (Array.isArray(userData.departments) && userData.departments.length > 0) {
          departmentData = {
            id: userData.departments[0].id || '',
            name: userData.departments[0].name || 'No Department'
          };
        } else if (typeof userData.departments === 'object') {
          departmentData = {
            id: userData.departments.id || '',
            name: userData.departments.name || 'No Department'
          };
        }
      }
      
      // Verify the profile picture URL if it exists
      let verifiedProfilePictureUrl = userData.profile_picture_url;
      if (verifiedProfilePictureUrl) {
        const verifiedUrl = await verifyImageUrl(verifiedProfilePictureUrl);
        if (verifiedUrl) {
          verifiedProfilePictureUrl = verifiedUrl;
        } else {
          console.warn('Profile picture URL verification failed, setting to null');
          verifiedProfilePictureUrl = null;
        }
      }
      
      const newUserData: User = {
        id: userData.id || '',
        username: userData.username || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        department_id: userData.department_id || '',
        profile_picture_url: verifiedProfilePictureUrl,
        department: departmentData
      };
      
      console.log('New user data with profile picture:', newUserData);
      
      setUsers([newUserData, ...users]);
      setShowAddModal(false);
      setNewUser({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        department_id: ''
      });
      setAvatarFile(null);
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Error adding user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit profile function
  const handleEditProfile = (userId: string) => {
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
      setSelectedUser(userToEdit);
      setShowEditModal(true);
    }
  };

  // Delete profile function
  const handleDeleteProfile = (userId: string) => {
    const userToDelete = users.find(user => user.id === userId);
    if (userToDelete) {
      setSelectedUser(userToDelete);
      setShowDeleteModal(true);
    }
  };

  // Update user function with Supabase integration
  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    setError(null);
    
    if (!selectedUser.username || !selectedUser.first_name || !selectedUser.last_name || !selectedUser.email || !selectedUser.phone_number || !selectedUser.department_id) {
      alert('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      let avatarUrl = selectedUser.profile_picture_url;
      
      // Handle profile picture upload if a new file was selected
      if (avatarFile) {
        // Check if the bucket exists before trying to upload
        const bucketExists = await checkBucketExists('profile_pictures');
        if (!bucketExists) {
          console.warn('Cannot upload profile picture: The profile_pictures bucket does not exist.');
        } else {
          console.log('Uploading file for update:', avatarFile.name, 'Size:', avatarFile.size, 'Type:', avatarFile.type);
          const uploadedUrl = await uploadImage(avatarFile, 'profile_pictures');
          if (uploadedUrl) {
            avatarUrl = uploadedUrl;
            console.log('Updated image URL:', avatarUrl);
          } else {
            console.warn('Failed to upload new profile picture. Keeping existing one.');
          }
        }
      }
      
      // Update user in Supabase
      const { data, error } = await supabase
        .from('users')
        .update({
          username: selectedUser.username,
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          email: selectedUser.email,
          phone_number: selectedUser.phone_number,
          department_id: selectedUser.department_id,
          profile_picture_url: avatarUrl
        })
        .eq('id', selectedUser.id)
        .select(`
          id,
          username,
          first_name,
          last_name,
          email,
          phone_number,
          department_id,
          profile_picture_url,
          departments (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;
      
      // Transform the data to match our User interface
      const userData = data as any;
      
      // Extract department data safely
      let departmentData = { id: '', name: 'No Department' };
      
      if (userData.departments) {
        if (Array.isArray(userData.departments) && userData.departments.length > 0) {
          departmentData = {
            id: userData.departments[0].id || '',
            name: userData.departments[0].name || 'No Department'
          };
        } else if (typeof userData.departments === 'object') {
          departmentData = {
            id: userData.departments.id || '',
            name: userData.departments.name || 'No Department'
          };
        }
      }
      
      const updatedUser: User = {
        id: userData.id || '',
        username: userData.username || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        department_id: userData.department_id || '',
        profile_picture_url: userData.profile_picture_url,
        department: departmentData
      };
      
      // Update the user in the local state
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          return updatedUser;
        }
        return user;
      });

      setUsers(updatedUsers);
      setShowEditModal(false);
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Error updating user. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete function with Supabase integration
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Delete user from Supabase
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      // Remove the user from the local state
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          User Management
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <UserIcon className="w-4 h-4" />
          Add User
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
        /* User Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              {/* User Card Content */}
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="relative w-16 h-16 mb-3">
                  {user.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Error loading image:', user.profile_picture_url);
                        // Try to reload the image with a cache-busting parameter
                        const target = e.target as HTMLImageElement;
                        const originalSrc = target.src;
                        if (!originalSrc.includes('?t=')) {
                          target.src = `${originalSrc}?t=${Date.now()}`;
                          console.log('Retrying with cache-busting URL:', target.src);
                        } else {
                          // If we've already tried cache-busting, show the fallback
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', user.profile_picture_url);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                      <UserIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {/* Fallback avatar that shows when image fails to load */}
                  <div className="fallback-avatar absolute inset-0 w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700" style={{ display: 'none' }}>
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  </div>
                </div>

                {/* User Info */}
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.department?.name || 'No Department'}
                </p>
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowViewModal(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                  >
                    <EyeIcon className="w-3 h-3" />
                    <span className="truncate">View</span>
                  </button>
                  <button
                    onClick={() => handleEditProfile(user.id)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                  >
                    <PencilIcon className="w-3 h-3" />
                    <span className="truncate">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(user.id)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                  >
                    <TrashIcon className="w-3 h-3" />
                    <span className="truncate">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New User
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  name="username"
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
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
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
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
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
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
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
                  value={newUser.phone_number}
                  onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <select
                  name="department_id"
                  value={newUser.department_id}
                  onChange={(e) => setNewUser({ ...newUser, department_id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ maxHeight: '200px', overflowY: 'auto' }}
                >
                  <option value="">Select Department</option>
                  {departments && departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id} className="dark:bg-gray-700">
                        {dept.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No departments available</option>
                  )}
                </select>
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
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
                  {isSubmitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedUser.profile_picture_url ? (
                  <img
                    src={selectedUser.profile_picture_url}
                    alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Username
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.username}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Department
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.department.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    First Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.first_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.last_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Phone Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.phone_number}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit User
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  name="username"
                  type="text"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
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
                    value={selectedUser.first_name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
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
                    value={selectedUser.last_name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })}
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
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
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
                  value={selectedUser.phone_number}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone_number: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={selectedUser.department_id}
                  onChange={(e) => {
                    const dept = departments.find(d => d.id === e.target.value);
                    if (dept && selectedUser) {
                      setSelectedUser({
                        ...selectedUser,
                        department_id: dept.id,
                        department: { id: dept.id, name: dept.name }
                      });
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
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
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Delete
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-900 dark:text-white">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;