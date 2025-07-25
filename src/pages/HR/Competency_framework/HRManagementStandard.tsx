import React, { useState, useEffect, useRef } from 'react';
import {
  PencilIcon,
  TrashBinIcon,
  ChevronDownIcon,
} from '../../../icons';
import { supabase } from '../../../lib/supabase';

interface Standard {
  id: number;
  name: string;
  domain_id: number;
  domain?: {
    id: number;
    domain_name: string;
  };
  definition: string;
}

interface Domain {
  id: number;
  domain_name: string;
  name?: string;
}

export default function HRManagementStandard() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [formData, setFormData] = useState({ name: '', domain_id: '', definition: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch standards
      const { data: standardsData, error: standardsError } = await supabase
        .from('competency_new')
        .select('*, domain:competency_domains(id, domain_name)')
        .order('id');
      if (standardsError) throw standardsError;
      // Fetch domains
      const { data: domainsData, error: domainsError } = await supabase
        .from('competency_domains')
        .select('*')
        .order('domain_name');
      if (domainsError) throw domainsError;
      // Process standards to ensure domain is an object
      const processedStandards = standardsData.map((item: any) => ({
        ...item,
        domain: Array.isArray(item.domain) && item.domain.length > 0 ? item.domain[0] : item.domain
      }));
      setStandards(processedStandards);
      setDomains(domainsData);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAdd = () => {
    setSelectedStandard(null);
    setFormData({ name: '', domain_id: '', definition: '' });
    setShowAddModal(true);
  };

  const handleEdit = (standard: Standard) => {
    setSelectedStandard(standard);
    setFormData({
      name: standard.name,
      domain_id: standard.domain?.id?.toString() || standard.domain_id.toString(),
      definition: standard.definition
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let domainId = parseInt(formData.domain_id);
      if (isNaN(domainId)) {
        const { data: existingDomain } = await supabase
          .from('competency_domains')
          .select('id')
          .eq('domain_name', formData.domain_id)
          .single();
        if (existingDomain) {
          domainId = existingDomain.id;
        } else {
          const { data: newDomain, error: domainError } = await supabase
            .from('competency_domains')
            .insert([{ domain_name: formData.domain_id }])
            .select()
            .single();
          if (domainError) throw domainError;
          domainId = newDomain.id;
        }
      }
      if (selectedStandard) {
        setIsUpdating(true);
        const { error } = await supabase
          .from('competency_new')
          .update({
            name: formData.name,
            domain_id: domainId,
            definition: formData.definition
          })
          .eq('id', selectedStandard.id);
        if (error) throw error;
        setShowEditModal(false);
      } else {
        setIsAdding(true);
        const { error } = await supabase
          .from('competency_new')
          .insert([{ name: formData.name, domain_id: domainId, definition: formData.definition }]);
        if (error) throw error;
        setShowAddModal(false);
      }
      await fetchAllData();
      setSelectedStandard(null);
      setFormData({ name: '', domain_id: '', definition: '' });
    } catch (err) {
      setError('Failed to save standard. Please try again later.');
    } finally {
      setIsAdding(false);
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStandard) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('competency_new')
        .delete()
        .eq('id', selectedStandard.id);
      if (error) throw error;
      await fetchAllData();
      setShowDeleteModal(false);
      setSelectedStandard(null);
    } catch (err) {
      setError('Failed to delete standard. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleDropdown = (id: number) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  // Filter standards based on search term
  const filteredStandards = standards.filter(standard =>
    standard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (standard.domain?.domain_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    standard.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">HR Management Standard</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Define and manage your organization's HR management standards. These standards will be referenced in assessments and other modules.</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          disabled={isAdding}
        >
          {isAdding ? (
            <>
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Adding...
            </>
          ) : (
            'Add Standard'
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <input
          type="text"
          className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
          placeholder="Search by standard name, domain, or definition..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="size-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading standards...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="w-1/4 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Standard Name</th>
                  <th className="w-1/4 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Domain</th>
                  <th className="w-2/4 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Definition</th>
                  <th className="w-1/6 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
                {filteredStandards.map((standard) => (
                  <tr key={`standard-${standard.id}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <td className="break-words px-4 py-4 text-sm text-gray-900 dark:text-white">{standard.name}</td>
                    <td className="break-words px-4 py-4 text-sm text-gray-900 dark:text-white">{standard.domain?.domain_name || <span className="text-gray-500 italic">No domain</span>}</td>
                    <td className="break-words px-4 py-4 text-sm text-gray-900 dark:text-white">{standard.definition}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <div className="relative inline-block" ref={dropdownRef}>
                        <button
                          onClick={() => toggleDropdown(standard.id)}
                          disabled={isAdding || isUpdating || isDeleting}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <span className="text-sm">Actions</span>
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                        {activeDropdown === standard.id && (
                          <div className={`actions-dropdown absolute right-0 z-[9999] w-36 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 ${standard.id === standards[standards.length - 1]?.id ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                            <div className="py-1">
                              <button
                                onClick={() => handleEdit(standard)}
                                disabled={isAdding || isUpdating || isDeleting}
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                <PencilIcon className="mr-3 h-4 w-4 text-amber-500" />
                                {isUpdating && selectedStandard?.id === standard.id ? (
                                  <>
                                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                                    Updating...
                                  </>
                                ) : (
                                  'Edit'
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStandard(standard);
                                  setShowDeleteModal(true);
                                  setActiveDropdown(null);
                                }}
                                disabled={isAdding || isUpdating || isDeleting}
                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-gray-700"
                              >
                                <TrashBinIcon className="mr-3 h-4 w-4" />
                                {isDeleting && selectedStandard?.id === standard.id ? (
                                  <>
                                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete'
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredStandards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No standards found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'No HR management standards have been created yet'}
          </p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-24 pb-8">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Add New Standard</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Standard Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter standard name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Domain</label>
                <select
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>{domain.domain_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Definition</label>
                <textarea
                  name="definition"
                  value={formData.definition}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter standard definition"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Standard'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStandard && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-24 pb-8">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Edit Standard</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Standard Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter standard name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Domain</label>
                <select
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>{domain.domain_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Definition</label>
                <textarea
                  name="definition"
                  value={formData.definition}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter standard definition"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Standard'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStandard && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-24 pb-8">
          <div className="w-full max-w-xs rounded-xl bg-white p-5 dark:bg-gray-900">
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white">Delete Standard</h2>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this standard?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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