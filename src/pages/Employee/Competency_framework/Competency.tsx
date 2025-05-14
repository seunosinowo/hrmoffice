import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Competency {
  id: number;
  name: string;
  domain_id: number;
  domain?: {
    id: number;
    name: string;
  };
  definition: string;
}



function Competency() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Competency[]>([]);

    // Add useEffect for fetching data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('competencies')
                .select(`
                    *,
                    domain:competencydomains(id, name)
                `)
                .order('created_at');

            if (error) throw error;

            // Process the data to ensure domain information is properly structured
            const processedData = data.map(item => {
                // If domain is an array with data, extract the first item
                if (item.domain && Array.isArray(item.domain) && item.domain.length > 0) {
                    return {
                        ...item,
                        domain: item.domain[0]
                    };
                }
                return item;
            });

            setData(processedData);
        } catch (error) {
            console.error('Error fetching competencies:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="h-full overflow-auto p-6">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Competency Layout</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">View organizational competencies</p>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Competency Name
                </th>
                <th className="px-8 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Domain
                </th>
                <th className="px-8 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Definition
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : data.map((item) => (
                <tr key={`competency-${item.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="whitespace-nowrap px-8 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {item.name}
                  </td>
                  <td className="whitespace-nowrap px-8 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {item.domain?.name || (
                      <span className="text-gray-500 italic">Loading domain...</span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {item.definition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

export default Competency;