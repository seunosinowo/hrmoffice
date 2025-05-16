import { useState, useEffect } from 'react';
import {
  UserIcon,
  StarIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompetencyRating {
  id: string;
  competency_id: string;
  rating: number;
  comments: string;
  assessor_comments?: string;
}

interface EmployeeAssessment {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  department_id: string;
  department_name: string;
  start_date: string;
  last_updated: string;
  status: string;
  progress: number;
  competency_ratings: CompetencyRating[];
}

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

export default function AssessorAssessment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<EmployeeAssessment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<EmployeeAssessment | null>(null);

  // Load employee assessments from Supabase
  useEffect(() => {
    const loadEmployeeAssessments = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get assessments for employees assigned to this assessor
        const { data, error: assessmentsError } = await supabase
          .from('employee_assessments')
          .select(`
            id,
            employee_id,
            employee_name,
            employee_email,
            department_id,
            department_name,
            start_date,
            last_updated,
            status,
            progress,
            competency_ratings,
            created_at
          `)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (assessmentsError) throw assessmentsError;

        if (data && data.length > 0) {
          setAssessments(data);
        }

      } catch (err) {
        console.error('Error loading assessor data:', err);
        setError('Failed to load data. Please refresh the page or contact support.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeAssessments();
  }, [user]);

  // Function to export assessment to PDF
  const exportToPDF = (assessment: EmployeeAssessment) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Employee Assessment Report', 14, 22);

    // Add employee info
    doc.setFontSize(12);
    doc.text(`Employee: ${assessment.employee_name}`, 14, 35);
    doc.text(`Department: ${assessment.department_name || 'N/A'}`, 14, 42);
    doc.text(`Assessment Date: ${formatDate(assessment.last_updated)}`, 14, 49);
    doc.text(`Status: ${assessment.status}`, 14, 56);

    // Add competency ratings table
    const tableColumn = ["Competency", "Rating", "Comments"];
    const tableRows = assessment.competency_ratings?.map(rating => [
      `Competency ${rating.competency_id}`,
      rating.rating.toString(),
      rating.comments
    ]) || [];

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Save the PDF
    doc.save(`${assessment.employee_name.replace(/\s+/g, '_')}_assessment.pdf`);
  };

  // Filter assessments by search term
  const filteredAssessments = assessments.filter(assessment =>
    assessment.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.department_name?.toLowerCase().includes(searchTerm.toLowerCase() || '')
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assessor Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review employee assessments and provide feedback
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by employee name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <UserIcon className="absolute left-3 top-1/2 h-5 w-5 text-gray-400 -translate-y-1/2" />
          </div>
        </div>

        {/* Employee Assessments Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Employee Assessments</h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                  <UserIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No Assessments Available</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg">
                  {searchTerm ? 'No assessments match your search criteria.' : 'There are no completed assessments from your assigned employees yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredAssessments.map(assessment => (
                <div
                  key={assessment.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {assessment.employee_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {assessment.department_name || 'No Department'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assessment.status === 'reviewed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {assessment.status === 'reviewed' ? 'Reviewed' : 'Completed'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Completed on {formatDate(assessment.last_updated)}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {assessment.competency_ratings?.length || 0} competencies rated
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAssessment(assessment)}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => exportToPDF(assessment)}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assessment Details Modal */}
        {selectedAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Employee Assessment Details
                    </h2>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      {selectedAssessment.employee_name} - {selectedAssessment.department_name || 'No Department'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAssessment(null)}
                    className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Assessment Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Employee
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedAssessment.employee_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Department
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedAssessment.department_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Assessment Date
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {formatDate(selectedAssessment.last_updated)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </label>
                        <p className="text-gray-900 dark:text-white capitalize">
                          {selectedAssessment.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Assessment Summary
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {selectedAssessment.progress}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Competencies</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {selectedAssessment.competency_ratings?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Competency Ratings
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Competency
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Rating
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Comments
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedAssessment.competency_ratings?.map((rating) => (
                          <tr key={rating.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              Competency {rating.competency_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{rating.rating}</span>
                                <div className="ml-2 flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= rating.rating
                                          ? 'text-yellow-400'
                                          : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {rating.comments || 'No comments'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => exportToPDF(selectedAssessment)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
