import { useState, useEffect } from 'react';
import {
  UserIcon,
  StarIcon,
  XCircleIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface Competency {
  id: string;
  name: string;
}

interface CompetencyRating {
  id: string;
  competency_id: string;
  rating: number;
  comments: string;
  assessor_comments?: string;
  assessor_rating?: number;
  consensus_rating?: number;
  consensus_comments?: string;
}

interface EmployeeAssessment {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  employee_full_name?: string;
  department_id: string;
  department_name: string;
  job_role_id?: string;
  job_role_name?: string;
  start_date: string;
  last_updated: string;
  status: string;
  progress: number;
  competency_ratings: CompetencyRating[];
  assessor_id?: string;
  assessor_name?: string;
  assessor_rating?: number;
  assessor_comments?: string;
  assessor_status?: string;
  // These fields don't exist in the database yet, but we'll add them to our interface
  consensus_rating: number | null;
  consensus_comments: string;
  consensus_status: string;
  created_at?: string;
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

export default function ConsensusAssessment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<EmployeeAssessment[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<EmployeeAssessment | null>(null);
  const [showConsensusModal, setShowConsensusModal] = useState(false);
  // No need for form data since we're just viewing

  // Load reviewed assessments from Supabase
  useEffect(() => {
    const loadReviewedAssessments = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get assessments that have been reviewed by assessors
        const { data, error: assessmentsError } = await supabase
          .from('employee_assessments')
          .select(`
            id,
            employee_id,
            employee_name,
            employee_email,
            employee_full_name,
            department_id,
            department_name,
            job_role_id,
            job_role_name,
            start_date,
            last_updated,
            status,
            progress,
            competency_ratings,
            assessor_id,
            assessor_name,
            assessor_rating,
            assessor_comments,
            assessor_status,
            created_at
          `)
          .eq('status', 'reviewed')
          .order('created_at', { ascending: false });

        if (assessmentsError) throw assessmentsError;

        if (data && data.length > 0) {
          // Ensure all assessments have the required fields and add consensus fields
          // since they don't exist in the database yet
          const processedData = data.map(assessment => {
            // First, process the competency ratings to add consensus fields if they don't exist
            const processedRatings = assessment.competency_ratings.map((rating: any) => ({
              ...rating,
              assessor_comments: rating.assessor_comments || '',
              assessor_rating: rating.assessor_rating || 0,
              // Add consensus fields that don't exist in the database
              consensus_rating: 0,
              consensus_comments: ''
            }));

            // Then return the processed assessment with all required fields
            return {
              ...assessment,
              assessor_id: assessment.assessor_id || null,
              assessor_name: assessment.assessor_name || null,
              assessor_rating: assessment.assessor_rating || null,
              assessor_comments: assessment.assessor_comments || null,
              assessor_status: assessment.assessor_status || 'pending',
              // Add consensus fields that don't exist in the database
              consensus_rating: null,
              consensus_comments: '',
              consensus_status: 'pending',
              competency_ratings: processedRatings
            };
          });

          setAssessments(processedData);
        }

        // Set standard competencies
        setCompetencies([
          { id: '1', name: 'Communication' },
          { id: '2', name: 'Problem Solving' },
          { id: '3', name: 'Leadership' },
          { id: '4', name: 'Technical Skills' },
          { id: '5', name: 'Teamwork' }
        ]);

      } catch (err) {
        console.error('Error loading consensus assessment data:', err);
        setError('Failed to load data. Please refresh the page or contact support.');
      } finally {
        setLoading(false);
      }
    };

    loadReviewedAssessments();
  }, [user]);

  // Function to export assessment to PDF
  const exportToPDF = (assessment: EmployeeAssessment) => {
    const doc = new jsPDF();

    // Calculate overall employee rating
    const employeeOverallRating = assessment.competency_ratings.length > 0
      ? (assessment.competency_ratings.reduce((sum, r) => sum + r.rating, 0) /
         assessment.competency_ratings.length).toFixed(1)
      : 'N/A';

    // Calculate overall consensus rating
    let overallConsensusRating = 'N/A';
    if (assessment.assessor_rating && assessment.competency_ratings.length > 0) {
      overallConsensusRating = ((assessment.assessor_rating +
        parseFloat(employeeOverallRating)) / 2).toFixed(1);
    }

    // Add title
    doc.setFontSize(18);
    doc.text('Consensus Assessment Report', 14, 22);

    // Add employee info
    doc.setFontSize(12);
    doc.text(`Employee: ${assessment.employee_full_name || assessment.employee_name}`, 14, 35);
    doc.text(`Department: ${assessment.department_name || 'N/A'}`, 14, 42);
    doc.text(`Assessment Date: ${formatDate(assessment.last_updated)}`, 14, 49);

    // Add rating summary
    doc.setFontSize(14);
    doc.text('Rating Summary', 14, 63);
    doc.setFontSize(12);
    doc.text(`Employee Self-Rating: ${employeeOverallRating}`, 14, 73);
    doc.text(`Assessor Rating: ${assessment.assessor_rating?.toFixed(1) || 'Not rated'}`, 14, 80);

    // Add consensus rating with highlight
    doc.setTextColor(128, 0, 128); // Purple color for consensus
    doc.text(`Consensus Rating: ${overallConsensusRating}`, 14, 87);
    doc.setTextColor(0, 0, 0); // Reset to black

    // Add explanation
    doc.setFontSize(10);
    doc.text('Note: Consensus rating is calculated as the average of employee and assessor ratings', 14, 97);

    // Add competency ratings table
    const tableColumn = ["Competency", "Employee Rating", "Assessor Rating", "Consensus Rating"];
    const tableRows = assessment.competency_ratings?.map(rating => {
      // Map competency ID to name
      const competencyName = competencies.find(c => c.id === rating.competency_id)?.name || `Competency ${rating.competency_id}`;

      // Calculate consensus rating for this competency
      let consensusRating = rating.rating.toString();
      if (rating.assessor_rating) {
        consensusRating = ((rating.rating + rating.assessor_rating) / 2).toFixed(1);
      }

      return [
        competencyName,
        rating.rating.toString(),
        rating.assessor_rating?.toString() || 'Not rated',
        consensusRating
      ];
    }) || [];

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 105,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Add comments section if available
    // Use a safe default value for the Y position after the table
    let commentsY = 200;

    // Try to get the final Y position from the last table
    try {
      // @ts-ignore - lastAutoTable is added by the autoTable plugin
      commentsY = doc.lastAutoTable?.finalY || 200;
    } catch (e) {
      console.log("Could not get lastAutoTable position, using default");
    }

    commentsY += 15;

    if (assessment.competency_ratings.some(r => r.comments || r.assessor_comments)) {
      doc.setFontSize(14);
      doc.text('Comments', 14, commentsY);
      commentsY += 10;

      assessment.competency_ratings.forEach(rating => {
        const competencyName = competencies.find(c => c.id === rating.competency_id)?.name || `Competency ${rating.competency_id}`;

        if (rating.comments || rating.assessor_comments) {
          doc.setFontSize(12);
          doc.text(competencyName, 14, commentsY);
          commentsY += 7;

          if (rating.comments) {
            doc.setFontSize(10);
            doc.text(`Employee: ${rating.comments}`, 20, commentsY);
            commentsY += 7;
          }

          if (rating.assessor_comments) {
            doc.setFontSize(10);
            doc.text(`Assessor: ${rating.assessor_comments}`, 20, commentsY);
            commentsY += 7;
          }

          commentsY += 3; // Add some space between competencies
        }
      });
    }

    // Save the PDF
    const employeeName = assessment.employee_full_name || assessment.employee_name;
    doc.save(`${employeeName.replace(/\s+/g, '_')}_consensus_assessment.pdf`);
  };

  // Filter assessments by search term
  const filteredAssessments = assessments.filter(assessment =>
    (assessment.employee_full_name || assessment.employee_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.department_name?.toLowerCase().includes(searchTerm.toLowerCase() || '') ||
    assessment.job_role_name?.toLowerCase().includes(searchTerm.toLowerCase() || '')
  );

  // Handle opening the details modal
  const handleOpenConsensusModal = (assessment: EmployeeAssessment) => {
    setSelectedAssessment(assessment);
    setShowConsensusModal(true);
  };

  // No need for consensus rating change or save functions since we're using auto-calculated consensus

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Consensus Assessments</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review employee and assessor ratings to provide consensus evaluations
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by employee name, department, or job role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <UserIcon className="absolute left-3 top-1/2 h-5 w-5 text-gray-400 -translate-y-1/2" />
          </div>
        </div>

        {/* Assessments Table Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reviewed Assessments</h2>

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
                  {searchTerm ? 'No assessments match your search criteria.' : 'There are no reviewed assessments available for consensus evaluation.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="py-3 px-4 text-left">Employee</th>
                    <th className="py-3 px-4 text-left">Department</th>
                    <th className="py-3 px-4 text-center">Employee Rating</th>
                    <th className="py-3 px-4 text-center">Assessor Rating</th>
                    <th className="py-3 px-4 text-center">Consensus</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAssessments.map(assessment => {
                    // Calculate average employee rating
                    const employeeRatings = assessment.competency_ratings.map(r => r.rating).filter(r => r > 0);
                    const avgEmployeeRating = employeeRatings.length > 0
                      ? (employeeRatings.reduce((sum, r) => sum + r, 0) / employeeRatings.length).toFixed(1)
                      : 'N/A';

                    // Get assessor rating
                    const assessorRating = assessment.assessor_rating
                      ? assessment.assessor_rating.toFixed(1)
                      : 'N/A';

                    // Automatically calculate consensus rating as average of employee and assessor ratings
                    let consensusRating = 'Not Set';
                    if (avgEmployeeRating !== 'N/A' && assessorRating !== 'N/A') {
                      const empRating = parseFloat(avgEmployeeRating);
                      const assRating = parseFloat(assessorRating);
                      const avgRating = ((empRating + assRating) / 2).toFixed(1);
                      consensusRating = avgRating;

                      // Update the assessment object with the calculated consensus rating if not already set
                      if (!assessment.consensus_rating) {
                        assessment.consensus_rating = parseFloat(avgRating);
                      }
                    } else if (assessment.consensus_rating) {
                      consensusRating = assessment.consensus_rating.toFixed(1);
                    }

                    return (
                      <tr key={assessment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {assessment.employee_full_name || assessment.employee_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 break-words">
                            {assessment.employee_email}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700 dark:text-gray-300 text-sm">
                          {assessment.department_name || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <span className="font-medium text-gray-900 dark:text-white mr-1 text-sm">
                              {avgEmployeeRating}
                            </span>
                            {avgEmployeeRating !== 'N/A' && <StarIcon className="h-4 w-4 text-yellow-400" />}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <span className="font-medium text-gray-900 dark:text-white mr-1 text-sm">
                              {assessorRating}
                            </span>
                            {assessorRating !== 'N/A' && <StarIcon className="h-4 w-4 text-yellow-400" />}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <span className={`font-medium text-sm ${
                              consensusRating === 'Not Set'
                                ? 'text-gray-400 dark:text-gray-500 italic'
                                : 'text-gray-900 dark:text-white mr-1'
                            }`}>
                              {consensusRating}
                            </span>
                            {consensusRating !== 'Not Set' && <StarIcon className="h-4 w-4 text-yellow-400" />}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleOpenConsensusModal(assessment)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 whitespace-nowrap"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assessment Details Modal */}
        {showConsensusModal && selectedAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Assessment Details
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {selectedAssessment.employee_full_name || selectedAssessment.employee_name} - {selectedAssessment.department_name || 'No Department'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConsensusModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <div className="mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Consensus Calculation
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                          <p>
                            Consensus ratings are calculated as the average of employee self-ratings and assessor ratings.
                            This provides an objective measure that balances both perspectives.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Overall Assessment Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Employee Self-Rating
                      </h4>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white mr-2">
                          {selectedAssessment.competency_ratings.length > 0
                            ? (selectedAssessment.competency_ratings.reduce((sum, r) => sum + r.rating, 0) /
                               selectedAssessment.competency_ratings.length).toFixed(1)
                            : 'N/A'}
                        </span>
                        <StarIcon className="h-6 w-6 text-yellow-400" />
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assessor Rating
                      </h4>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white mr-2">
                          {selectedAssessment.assessor_rating
                            ? selectedAssessment.assessor_rating.toFixed(1)
                            : 'N/A'}
                        </span>
                        <StarIcon className="h-6 w-6 text-yellow-400" />
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                        Consensus Rating
                      </h4>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-purple-700 dark:text-purple-300 mr-2">
                          {selectedAssessment.assessor_rating && selectedAssessment.competency_ratings.length > 0
                            ? ((selectedAssessment.assessor_rating +
                                (selectedAssessment.competency_ratings.reduce((sum, r) => sum + r.rating, 0) /
                                 selectedAssessment.competency_ratings.length)) / 2).toFixed(1)
                            : 'N/A'}
                        </span>
                        <StarIcon className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Competency Details
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white dark:bg-gray-700 rounded-lg">
                      <thead className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        <tr>
                          <th className="py-3 px-4 text-left">Competency</th>
                          <th className="py-3 px-4 text-center">Employee Rating</th>
                          <th className="py-3 px-4 text-center">Assessor Rating</th>
                          <th className="py-3 px-4 text-center">Consensus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {selectedAssessment.competency_ratings.map((rating) => {
                          const competencyName = competencies.find(c => c.id === rating.competency_id)?.name || `Competency ${rating.competency_id}`;

                          // Calculate auto consensus as average of employee and assessor ratings
                          let autoConsensus = rating.rating;
                          if (rating.assessor_rating && rating.assessor_rating > 0) {
                            autoConsensus = (rating.rating + rating.assessor_rating) / 2;
                          }

                          return (
                            <tr key={rating.competency_id} className="hover:bg-gray-50 dark:hover:bg-gray-600/30">
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {competencyName}
                                </div>
                                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  {rating.comments && (
                                    <div className="mt-2">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Employee Comments:</div>
                                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{rating.comments}</p>
                                    </div>
                                  )}
                                  {rating.assessor_comments && (
                                    <div className="mt-2">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Assessor Comments:</div>
                                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{rating.assessor_comments}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="font-medium text-gray-900 dark:text-white mr-1">
                                    {rating.rating}
                                  </span>
                                  <StarIcon className="h-4 w-4 text-yellow-400" />
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="font-medium text-gray-900 dark:text-white mr-1">
                                    {rating.assessor_rating || 'N/A'}
                                  </span>
                                  {rating.assessor_rating && rating.assessor_rating > 0 && <StarIcon className="h-4 w-4 text-yellow-400" />}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="font-medium text-purple-700 dark:text-purple-300 mr-1">
                                    {autoConsensus.toFixed(1)}
                                  </span>
                                  <StarIcon className="h-4 w-4 text-purple-500" />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <button
                  onClick={() => setShowConsensusModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Close
                </button>
                <button
                  onClick={() => exportToPDF(selectedAssessment)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md flex items-center"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                  Export to PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}