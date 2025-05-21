import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface JobCompetencyProfile {
  id: number;
  job_id: number;
  competency_id: number;
  required_proficiency_level_id: number;
  jobs: {
    id: number;
    title: string;
  };
  competencies: {
    id: number;
    name: string;
  };
  proficiency_levels: {
    id: number;
    name: string;
  };
}

// Helper function to get competency name based on ID
const getCompetencyName = (id: number): string => {
  const competencyMap: Record<number, string> = {
    1: 'Communication',
    2: 'Problem Solving',
    3: 'Leadership',
    4: 'Technical Skills',
    5: 'Teamwork',
    6: 'Adaptability',
    7: 'Critical Thinking',
    8: 'Time Management',
    9: 'Creativity',
    10: 'Emotional Intelligence',
    11: 'Decision Making',
    12: 'Conflict Resolution',
    13: 'Project Management',
    14: 'Customer Service',
    15: 'Strategic Planning'
  };
  return competencyMap[id] || `Competency ${id}`;
};

export default function JobCompetencyProfile() {
  const [profiles, setProfiles] = useState<JobCompetencyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch job competency profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('job_competency_profile')
        .select('*')
        .order('id');

      if (profilesError) throw profilesError;

      // Fetch jobs to get titles
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title');

      if (jobsError) throw jobsError;

      // Fetch proficiency levels with competency_id to match the correct descriptions
      const { data: levelsData, error: levelsError } = await supabase
        .from('competency_proficiencies')
        .select('*');

      if (levelsError) throw levelsError;

      // Join the data manually
      const enhancedProfiles = profilesData.map(profile => {
        const job = jobsData?.find(j => j.id === profile.job_id);
        
        // Find the correct proficiency level description for this competency and level
        // We need to match both the competency_id and the proficiency level
        const matchingLevel = levelsData?.find(l => 
          l.competency_id === profile.competency_id && 
          l.proficiency_level_id === profile.required_proficiency_level_id
        );
        
        // Map proficiency level IDs to standard names
        const levelNames: Record<number, string> = {
          1: 'Basic',
          2: 'Intermediate',
          3: 'Advanced',
          4: 'Expert'
        };
        
        // Start with a default level name
        let levelName = 'Unknown Level';
        
        // First try to use the standard level name based on ID
        const levelId = profile.required_proficiency_level_id;
        if (levelId in levelNames) {
          levelName = levelNames[levelId];
        }
        
        // If we found a matching level with a description, use that instead
        if (matchingLevel && matchingLevel.description) {
          levelName = matchingLevel.description;
        } else {
          // If no competency-specific description was found, try to find a generic level
          const genericLevel = levelsData?.find(l => 
            l.id === profile.required_proficiency_level_id || 
            l.proficiency_level_id === profile.required_proficiency_level_id
          );
          
          if (genericLevel) {
            if (genericLevel.name) levelName = genericLevel.name;
            else if (genericLevel.level_name) levelName = genericLevel.level_name;
            else if (genericLevel.proficiency_name) levelName = genericLevel.proficiency_name;
            else if (genericLevel.title) levelName = genericLevel.title;
          }
        }

        return {
          ...profile,
          jobs: {
            id: profile.job_id,
            title: job?.title || 'Unknown Job'
          },
          competencies: {
            id: profile.competency_id,
            name: getCompetencyName(profile.competency_id)
          },
          proficiency_levels: {
            id: profile.required_proficiency_level_id,
            name: levelName
          }
        };
      });

      setProfiles(enhancedProfiles);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter profiles based on search term
  const filteredProfiles = profiles.filter(profile =>
    profile.jobs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.competencies.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.proficiency_levels.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Job Competency Profiles</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">View job competency profiles and their required proficiency levels</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <input
          type="text"
          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
          placeholder="Search by job title, competency, or proficiency level..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="size-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading profiles...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Profiles Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th scope="col" className="w-1/3 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Job Title
                  </th>
                  <th scope="col" className="w-1/3 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Competency
                  </th>
                  <th scope="col" className="w-1/3 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Required Proficiency Level
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No profiles found matching your search.' : 'No profiles available.'}
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile) => (
                    <tr key={`profile-${profile.id}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                      <td className="break-words px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {profile.jobs.title}
                      </td>
                      <td className="break-words px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {profile.competencies.name}
                      </td>
                      <td className="break-words px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                        {profile.proficiency_levels.name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProfiles.length === 0 && !searchTerm && (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No profiles found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No job competency profiles have been created yet
          </p>
        </div>
      )}
    </div>
  );
}
