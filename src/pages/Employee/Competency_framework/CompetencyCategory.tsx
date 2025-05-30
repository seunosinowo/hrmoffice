import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { InfoIcon, ChevronDownIcon } from "../../../icons";

interface CompetencyCategory {
  id: number;
  category: string;
  proficiency_level: number;
  description: string;
  created_at: string;
  updated_at: string;
}

// Add proficiency level mapping with proper typing
interface ProficiencyLevelMap {
  [key: number]: string;
}

const proficiencyLevelMap: ProficiencyLevelMap = {
  1: 'Basic',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert'
};

export default function CompetencyCategory() {
  const [data, setData] = useState<CompetencyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempProficiencyLevels, setTempProficiencyLevels] = useState<{[key: number]: number}>({});

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
        .order('created_at', { ascending: true });

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
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
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
                          value={tempProficiencyLevels[item.id] || item.proficiency_level}
                          onChange={(e) => {
                            const newLevel = parseInt(e.target.value);
                            setTempProficiencyLevels({
                              ...tempProficiencyLevels,
                              [item.id]: newLevel
                            });
                          }}
                          className="block w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-8 text-center text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tempProficiencyLevels[item.id]
                      ? proficiencyLevelMap[tempProficiencyLevels[item.id]]
                      : proficiencyLevelMap[item.proficiency_level]}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}