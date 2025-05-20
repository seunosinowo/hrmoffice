import { supabase } from '../../../lib/supabase';
import { useState, useEffect } from 'react';
import {
  UserIcon,
  InfoIcon
} from "../../../icons";

interface CompetencyProficiency {
  id: number;
  competency_name: string;
  proficiency_level: string;
  description: string;
  created_at: string;
}



export default function CompetencyProficiency() {
  const [proficiencies, setProficiencies] = useState<CompetencyProficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProficiencies();
  }, []);

  const fetchProficiencies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('competency_proficiencies')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProficiencies(data || []);
    } catch (err) {
      console.error("Error fetching proficiencies:", err);
      setError('Failed to load competency proficiencies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter proficiencies based on search term
  const filteredProficiencies = proficiencies.filter(proficiency =>
    proficiency.competency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proficiency.proficiency_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Competency Proficiency</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">View competency proficiency levels and descriptions</p>
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
          placeholder="Search by competency or proficiency level..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="size-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading proficiencies...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={fetchProficiencies}
            className="mt-2 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Proficiencies Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Competency Name
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Proficiency Level
                  </th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
                {filteredProficiencies.map((proficiency) => (
                  <tr key={`proficiency-${proficiency.id}-${proficiency.competency_name}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <UserIcon className="size-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900 dark:text-white">{proficiency.competency_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {proficiency.proficiency_level}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {proficiency.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProficiencies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <UserIcon className="size-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No proficiencies found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'No competency proficiencies have been created yet'}
          </p>
        </div>
      )}


    </div>
  );
}