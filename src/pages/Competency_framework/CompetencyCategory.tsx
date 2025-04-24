import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  PlusIcon, 
  TrashBinIcon,
  InfoIcon,
  PencilIcon,
  ChevronDownIcon
} from "../../icons";

const proficiencyLevels = {
  1: "Basic",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert"
};

interface CompetencyCategory {
  id: number;
  category: string;
  proficiency_level: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function CompetencyCategory() {
  const [data, setData] = useState<CompetencyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CompetencyCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    proficiency_level: 1,
    description: "Basic"
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add filtered data state
  const [filteredData, setFilteredData] = useState<CompetencyCategory[]>([]);

  // Update filtered data when search term or data changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item =>
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  // Fetch data from Supabase
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('competency_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data || []);
      setFilteredData(data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Failed to load competency categories');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProficiencyChange = async (id: number, newLevel: number) => {
    try {
      const { error } = await supabase
        .from('competency_categories')
        .update({ 
          proficiency_level: newLevel,
          description: proficiencyLevels[newLevel as keyof typeof proficiencyLevels]
        })
        .eq('id', id);

      if (error) throw error;
      
      setData(data.map(item => 
        item.id === id 
          ? { 
              ...item, 
              proficiency_level: newLevel, 
              description: proficiencyLevels[newLevel as keyof typeof proficiencyLevels] 
            }
          : item
      ));
    } catch (err) {
      console.error("Error updating proficiency level:", err);
      setError('Failed to update proficiency level');
    }
  };

  const handleDelete = async (item: CompetencyCategory) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem || isDeleting) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('competency_categories')
        .delete()
        .eq('id', selectedItem.id);

      if (error) throw error;
      
      setData(data.filter(i => i.id !== selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Error deleting item:", err);
      setError('Failed to delete competency category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item: CompetencyCategory) => {
    setSelectedItem(item);
    setFormData({
      category: item.category,
      proficiency_level: item.proficiency_level,
      description: item.description
    });
    setShowAddModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || isUpdating) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('competency_categories')
        .update({
          category: formData.category,
          proficiency_level: formData.proficiency_level,
          description: formData.description
        })
        .eq('id', selectedItem.id);

      if (error) throw error;
      
      setData(data.map(item => 
        item.id === selectedItem.id 
          ? { ...item, ...formData }
          : item
      ));
      setShowAddModal(false);
      setSelectedItem(null);
      setFormData({
        category: "",
        proficiency_level: 1,
        description: "Basic"
      });
    } catch (err) {
      console.error("Error updating item:", err);
      setError('Failed to update competency category');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) return;
    
    try {
      setIsAdding(true);
      const { error } = await supabase
        .from('competency_categories')
        .insert([formData]);

      if (error) throw error;
      
      await fetchData();
      setShowAddModal(false);
      setFormData({
        category: "",
        proficiency_level: 1,
        description: "Basic"
      });
    } catch (err) {
      console.error("Error adding item:", err);
      setError('Failed to add competency category');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleDropdown = (id: number) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading competency categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Competency Category</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Building a foundation of excellence through defined competencies</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 w-full sm:w-auto"
          >
            <PlusIcon className="size-0" />
            <span>Add Category</span>
          </button>
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
          placeholder="Search by category name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category Name
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Proficiency Level
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No categories found matching your search' : 'No categories available'}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      <div className="relative inline-block w-24">
                        <select
                          value={item.proficiency_level}
                          onChange={(e) => handleProficiencyChange(item.id, parseInt(e.target.value))}
                          className="block w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-8 text-center text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          {Object.entries(proficiencyLevels).map(([level, _]) => (
                            <option 
                              key={level} 
                              value={level}
                              className="text-center"
                            >
                              {level}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative actions-dropdown">
                      <button
                        onClick={() => toggleDropdown(item.id)}
                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                      >
                        Actions
                        <ChevronDownIcon className="ml-1 size-4" />
                      </button>
                      {activeDropdown === item.id && (
                        <div className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900" style={{ position: 'fixed' }}>
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            <PencilIcon className="mr-2 size-4 text-amber-500" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
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
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">
              {selectedItem ? 'Edit Category' : 'Add New Category'}
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              {selectedItem ? 'Update competency category details' : 'Create a new competency category'}
            </p>
            
            <form onSubmit={selectedItem ? handleUpdate : handleAdd} className="mt-6 space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category Name
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <label htmlFor="proficiency_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Proficiency Level
                </label>
                <select
                  id="proficiency_level"
                  value={formData.proficiency_level}
                  onChange={(e) => {
                    const level = parseInt(e.target.value);
                    setFormData({
                      ...formData,
                      proficiency_level: level,
                      description: proficiencyLevels[level as keyof typeof proficiencyLevels]
                    });
                  }}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  {Object.entries(proficiencyLevels).map(([level, description]) => (
                    <option key={level} value={level}>
                      Level {level} - {description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedItem(null);
                    setFormData({
                      category: "",
                      proficiency_level: 1,
                      description: "Basic"
                    });
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isAdding || isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isAdding || isUpdating}
                >
                  {isAdding || isUpdating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {selectedItem ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    selectedItem ? 'Update Category' : 'Add Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-24 pb-8">
          <div className="w-full max-w-xs rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Delete Category</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the category "{selectedItem.category}"?
            </p>
            
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}