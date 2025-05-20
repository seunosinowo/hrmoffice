import React, { useState, useEffect } from "react";
import { InfoIcon } from "../../../icons";
import { supabase } from "../../../lib/supabase";

interface CompetencyCategory {
  id: number;
  name: string;
  created_at: string;
}

interface CompetencyDomain {
  id: number;
  domain_name: string;
  category_id: number;
  category?: CompetencyCategory;
  created_at: string;
}

export default function CompetencyDomain() {
  const [data, setData] = useState<CompetencyDomain[]>([]);
  const [filteredData, setFilteredData] = useState<CompetencyDomain[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Add this function to group domains by category
  const groupDomainsByCategory = (domains: CompetencyDomain[]) => {
    return domains.reduce((acc, domain) => {
      // Skip domains without a category
      if (!domain.category?.name) return acc;

      const categoryName = domain.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(domain);
      return acc;
    }, {} as Record<string, CompetencyDomain[]>);
  };

  // Get grouped data for current page
  const groupedData = groupDomainsByCategory(currentItems);

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch domains with category information
      const { data: domainsData, error: domainsError } = await supabase
        .from('competency_domains')
        .select(`
          *,
          category:category2domain(*)
        `)
        .order('domain_name');

      if (domainsError) throw domainsError;
      setData(domainsData);
      setFilteredData(domainsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle search
  useEffect(() => {
    const filtered = data.filter(item =>
      item.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, data]);



  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Competency Domains</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">View organizational competency domains</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-11 text-sm shadow-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
            placeholder="Search domains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <InfoIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Domain Name
              </th>
              <th className="px-8 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Category
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {loading ? (
              <tr>
                <td colSpan={2} className="px-8 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : Object.entries(groupedData).map(([category, domains], index) => (
              <React.Fragment key={`category-${category}`}>
                {index > 0 && (
                  <tr key={`separator-${category}`}>
                    <td colSpan={2} className="h-6 bg-transparent border-t-2 border-gray-200 dark:border-gray-700"></td>
                  </tr>
                )}
                <tr key={`header-${category}`} className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan={2} className="px-8 py-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {category}
                    </h3>
                  </td>
                </tr>
                {domains.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-8 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {item.domain_name}
                    </td>
                    <td className="whitespace-nowrap px-8 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {category}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>



      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} domains
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Previous
            </button>
            <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}