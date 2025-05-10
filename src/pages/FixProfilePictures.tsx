import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

interface FixResult {
  id: string;
  name: string;
  oldUrl: string | null;
  newUrl: string | null;
  success: boolean;
  error?: string;
}

const FixProfilePictures: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fixResults, setFixResults] = useState<FixResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, profile_picture_url')
        .order('first_name');

      if (error) throw error;

      setEmployees(data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fixAllProfilePictures = async () => {
    try {
      setFixing(true);
      setError(null);
      setFixResults([]);

      const results: FixResult[] = [];

      for (const employee of employees) {
        if (employee.profile_picture_url) {
          try {
            // Check if the URL has query parameters
            const hasQueryParams = employee.profile_picture_url.includes('?');
            
            if (hasQueryParams) {
              // Remove query parameters
              const cleanUrl = employee.profile_picture_url.split('?')[0];
              
              // Update the employee record
              const { error: updateError } = await supabase
                .from('employees')
                .update({ profile_picture_url: cleanUrl })
                .eq('id', employee.id);
              
              if (updateError) {
                results.push({
                  id: employee.id,
                  name: `${employee.first_name} ${employee.last_name}`,
                  oldUrl: employee.profile_picture_url,
                  newUrl: cleanUrl,
                  success: false,
                  error: updateError.message
                });
              } else {
                results.push({
                  id: employee.id,
                  name: `${employee.first_name} ${employee.last_name}`,
                  oldUrl: employee.profile_picture_url,
                  newUrl: cleanUrl,
                  success: true
                });
              }
            } else {
              // URL is already clean
              results.push({
                id: employee.id,
                name: `${employee.first_name} ${employee.last_name}`,
                oldUrl: employee.profile_picture_url,
                newUrl: employee.profile_picture_url,
                success: true,
                error: 'URL already clean'
              });
            }
          } catch (err) {
            results.push({
              id: employee.id,
              name: `${employee.first_name} ${employee.last_name}`,
              oldUrl: employee.profile_picture_url,
              newUrl: null,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
          }
        } else {
          // No profile picture URL
          results.push({
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            oldUrl: null,
            newUrl: null,
            success: false,
            error: 'No profile picture URL'
          });
        }
      }

      setFixResults(results);
      
      // Refresh the employee list
      await fetchEmployees();
    } catch (err) {
      console.error('Error fixing profile pictures:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Fix Profile Pictures</h1>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Employee Profile Pictures</h2>
        
        <div className="mb-4">
          <button
            onClick={fixAllProfilePictures}
            disabled={fixing || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fixing ? 'Fixing...' : 'Fix All Profile Pictures'}
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {employees.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No employees found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Employee
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Profile Picture URL
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Has Query Params
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {employee.profile_picture_url ? (
                                <img
                                  src={`${employee.profile_picture_url.split('?')[0]}?t=${Date.now()}`}
                                  alt={`${employee.first_name} ${employee.last_name}`}
                                  className="h-10 w-10 rounded-full"
                                  crossOrigin="anonymous"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {employee.first_name} {employee.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {employee.profile_picture_url || 'No URL'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.profile_picture_url ? (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.profile_picture_url.includes('?') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'}`}>
                              {employee.profile_picture_url.includes('?') ? 'Yes' : 'No'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                              N/A
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      
      {fixResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Fix Results</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Old URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    New URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {fixResults.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {result.oldUrl || 'No URL'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {result.newUrl || 'No URL'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${result.success ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                      {result.error && (
                        <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                          {result.error}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixProfilePictures;
