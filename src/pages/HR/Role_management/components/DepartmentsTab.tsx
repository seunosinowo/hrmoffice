import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import {
  TrashBinIcon,
  PencilIcon,
  ChevronDownIcon,
} from "../../../../icons";

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface DepartmentFormData {
  name: string;
  description: string;
}

interface DepartmentsTabProps {
  departments: Department[];
  loadingDepartments: boolean;
  fetchDepartments: () => Promise<void>;
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
}

export default function DepartmentsTab({ departments, loadingDepartments, fetchDepartments, setDepartments }: DepartmentsTabProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentFormData, setDepartmentFormData] = useState<DepartmentFormData>({ name: '', description: '' });
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [showDeleteDepartmentModal, setShowDeleteDepartmentModal] = useState(false);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [isUpdatingDepartment, setIsUpdatingDepartment] = useState(false);
  const [isDeletingDepartment, setIsDeletingDepartment] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  // Create refs for dropdown menus
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Filter departments based on search query
  useEffect(() => {
    if (!departments) {
      setFilteredDepartments([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredDepartments(departments);
      return;
    }

    const filtered = departments.filter(
      dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setFilteredDepartments(filtered);
  }, [departments, searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeDropdown) {
        const dropdownRef = dropdownRefs.current[activeDropdown];
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleDropdown = (id: string) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  // Add department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsAddingDepartment(true);
      setDepartmentError(null);

      if (!departmentFormData.name.trim()) {
        setDepartmentError('Department name is required');
        setIsAddingDepartment(false);
        return;
      }

      const newDepartment = {
        name: departmentFormData.name.trim(),
        description: departmentFormData.description.trim()
      };

      const { data, error } = await supabase
        .from('departments')
        .insert([newDepartment])
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately to prevent table scattering
      if (data) {
        // Add the new department to the end of the local state
        setDepartments(prevDepartments => [...prevDepartments, data]);

        // Also update the filtered departments, adding to the end
        setFilteredDepartments(prevFiltered => [...prevFiltered, data]);
      }

      // Start background fetch but don't wait for it
      fetchDepartments().catch(err => {
        console.error('Error refreshing departments in background:', err);
      });

      // Clear form and close modal
      setShowAddDepartmentModal(false);
      setDepartmentFormData({ name: '', description: '' });
    } catch (error: any) {
      console.error('Error adding department:', error);
      if (error.code === '23505') {
        setDepartmentError('A department with this name already exists');
      } else {
        setDepartmentError('Failed to add department. Please try again.');
      }
    } finally {
      setIsAddingDepartment(false);
    }
  };

  // Update department
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDepartment) return;

    try {
      setIsUpdatingDepartment(true);
      setDepartmentError(null);

      if (!departmentFormData.name.trim()) {
        setDepartmentError('Department name is required');
        setIsUpdatingDepartment(false);
        return;
      }

      const updatedDepartment = {
        id: selectedDepartment.id,
        name: departmentFormData.name.trim(),
        description: departmentFormData.description.trim()
      };

      // Update the record
      const { error } = await supabase
        .from('departments')
        .update({
          name: updatedDepartment.name,
          description: updatedDepartment.description
        })
        .eq('id', selectedDepartment.id);

      if (error) throw error;

      // Update local state immediately to prevent table scattering
      setDepartments(prevDepartments =>
        prevDepartments.map(dept =>
          dept.id === selectedDepartment.id ? updatedDepartment : dept
        )
      );

      // Also update filtered departments
      setFilteredDepartments(prevFiltered =>
        prevFiltered.map(dept =>
          dept.id === selectedDepartment.id ? updatedDepartment : dept
        )
      );

      // Start background fetch but don't wait for it
      fetchDepartments().catch(err => {
        console.error('Error refreshing departments in background:', err);
      });

      setShowEditDepartmentModal(false);
      setSelectedDepartment(null);
    } catch (error: any) {
      console.error('Error updating department:', error);
      if (error.code === '23505') {
        setDepartmentError('A department with this name already exists');
      } else {
        setDepartmentError('Failed to update department. Please try again.');
      }
    } finally {
      setIsUpdatingDepartment(false);
    }
  };

  // Delete department
  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      setIsDeletingDepartment(true);

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', selectedDepartment.id);

      if (error) throw error;

      // Update local state immediately to prevent table scattering
      setDepartments(prevDepartments =>
        prevDepartments.filter(dept => dept.id !== selectedDepartment.id)
      );

      // Also update filtered departments
      setFilteredDepartments(prevFiltered =>
        prevFiltered.filter(dept => dept.id !== selectedDepartment.id)
      );

      // Start background fetch but don't wait for it
      fetchDepartments().catch(err => {
        console.error('Error refreshing departments in background:', err);
      });

      setShowDeleteDepartmentModal(false);
      setSelectedDepartment(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      setDepartmentError('Failed to delete department. It may be in use by employees.');
    } finally {
      setIsDeletingDepartment(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white pl-3 pr-10 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="size-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Add Department Button */}
        <button
          onClick={() => {
            // Clear form data when opening the modal
            setDepartmentFormData({ name: '', description: '' });
            setDepartmentError(null);
            setShowAddDepartmentModal(true);
          }}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Add Department
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Name
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Description
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
              {loadingDepartments ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredDepartments.length > 0 ? (
                filteredDepartments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {department.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {department.description || 'No description'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <div className="relative actions-dropdown">
                        <button
                          onClick={() => toggleDropdown(`dept-${department.id}`)}
                          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                        >
                          Actions
                          <ChevronDownIcon className="ml-1 size-4" />
                        </button>

                        {activeDropdown === `dept-${department.id}` && (
                          <div
                            ref={(el) => {
                              dropdownRefs.current[`dept-${department.id}`] = el;
                              return undefined;
                            }}
                            className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900"
                          >
                            <button
                              onClick={() => {
                                setSelectedDepartment(department);
                                setDepartmentFormData({
                                  name: department.name,
                                  description: department.description || ''
                                });
                                setShowEditDepartmentModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              <PencilIcon className="mr-2 size-4 text-amber-500" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDepartment(department);
                                setShowDeleteDepartmentModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              <TrashBinIcon className="mr-2 size-4 text-red-500" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery.trim()
                      ? `No departments found matching "${searchQuery}".`
                      : 'No departments found. Add a department to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Add Department</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Create a new department
            </p>

            {departmentError && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/20">
                <p className="text-red-600 dark:text-red-400">{departmentError}</p>
              </div>
            )}

            <form onSubmit={handleAddDepartment} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={departmentFormData.name}
                  onChange={(e) => setDepartmentFormData({...departmentFormData, name: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  value={departmentFormData.description}
                  onChange={(e) => setDepartmentFormData({...departmentFormData, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddDepartmentModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isAddingDepartment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isAddingDepartment}
                >
                  {isAddingDepartment ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Department'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDepartmentModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Edit Department</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Update department details
            </p>

            {departmentError && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/20">
                <p className="text-red-600 dark:text-red-400">{departmentError}</p>
              </div>
            )}

            <form onSubmit={handleUpdateDepartment} className="mt-6 space-y-4">
              <div>
                <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department Name
                </label>
                <input
                  type="text"
                  id="edit_name"
                  value={departmentFormData.name}
                  onChange={(e) => setDepartmentFormData({...departmentFormData, name: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="edit_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="edit_description"
                  value={departmentFormData.description}
                  onChange={(e) => setDepartmentFormData({...departmentFormData, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditDepartmentModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isUpdatingDepartment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isUpdatingDepartment}
                >
                  {isUpdatingDepartment ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Department'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Department Confirmation Modal */}
      {showDeleteDepartmentModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Delete Department</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the department "{selectedDepartment.name}"?
            </p>
            <p className="mt-2 text-center text-sm text-red-500">
              This action cannot be undone.
            </p>

            {departmentError && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/20">
                <p className="text-red-600 dark:text-red-400">{departmentError}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDepartmentModal(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                disabled={isDeletingDepartment}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDepartment}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                disabled={isDeletingDepartment}
              >
                {isDeletingDepartment ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Department'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
