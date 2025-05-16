import { useState, useEffect } from 'react';
import {
  UserIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  StarIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

interface CompetencyRating {
  id: string;
  competencyId: string;
  rating: number;
  comments: string;
  assessor_comments?: string;
}

interface EmployeeAssessment {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  departmentId: string;
  departmentName: string;
  startDate: string;
  lastUpdated: string;
  status: string;
  progress: number;
  competencyRatings: CompetencyRating[];
}

// Helper functions
const formatDate = (dateString: string) => {
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
  const [employeeAssessments, setEmployeeAssessments] = useState<EmployeeAssessment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<EmployeeAssessment | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessorComments, setAssessorComments] = useState<Record<string, string>>({});

  // Load employee assessments from Supabase
  useEffect(() => {
    const loadEmployeeAssessments = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get assessments for employees assigned to this assessor
        const { data, error: assessmentsError } = await supabase
          .from('employee_assessments')
          .select('*')
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (assessmentsError) throw assessmentsError;

        if (data && data.length > 0) {
          // Process assessments
          const processedAssessments = data.map(assessment => {
            // Get competency ratings from the assessment data
            const competencyRatings = assessment.competency_ratings || [];

            // Map to EmployeeAssessment type
            return {
              id: assessment.id,
              employeeId: assessment.employee_id,
              employeeName: assessment.employee_name,
              employeeEmail: assessment.employee_email,
              departmentId: assessment.department_id || '',
              departmentName: assessment.department_name || '',
              startDate: assessment.start_date,
              lastUpdated: assessment.last_updated,
              status: assessment.status,
              progress: assessment.progress,
              competencyRatings: competencyRatings.map((rating: any) => ({
                id: rating.id,
                competencyId: rating.competency_id,
                rating: rating.rating,
                comments: rating.comments || '',
                assessor_comments: rating.assessor_comments || ''
              }))
            };
          });

          setEmployeeAssessments(processedAssessments);
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

  // Function to view assessment details
  const viewAssessment = (assessment: EmployeeAssessment) => {
    setSelectedAssessment(assessment);

    // Initialize assessor comments from existing data
    const comments: Record<string, string> = {};
    assessment.competencyRatings.forEach(rating => {
      if (rating.assessor_comments) {
        comments[rating.competencyId] = rating.assessor_comments;
      }
    });

    setAssessorComments(comments);
    setShowAssessmentModal(true);
  };

  // Function to save assessor comments
  const saveAssessorComments = async () => {
    if (!selectedAssessment) return;

    try {
      setLoading(true);

      // Update competency ratings with assessor comments
      const updatedRatings = selectedAssessment.competencyRatings.map(rating => ({
        ...rating,
        assessor_comments: assessorComments[rating.competencyId] || rating.assessor_comments
      }));

      // Update the assessment in Supabase
      const { error: updateError } = await supabase
        .from('employee_assessments')
        .update({
          status: 'reviewed',
          last_updated: new Date().toISOString(),
          competency_ratings: updatedRatings.map(rating => ({
            id: rating.id,
            competency_id: rating.competencyId,
            rating: rating.rating,
            comments: rating.comments,
            assessor_comments: rating.assessor_comments
          }))
        })
        .eq('id', selectedAssessment.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedAssessment: EmployeeAssessment = {
        ...selectedAssessment,
        status: 'reviewed',
        lastUpdated: new Date().toISOString(),
        competencyRatings: updatedRatings
      };

      setEmployeeAssessments(prevAssessments =>
        prevAssessments.map(a => a.id === updatedAssessment.id ? updatedAssessment : a)
      );

      setSelectedAssessment(updatedAssessment);
      setShowAssessmentModal(false);

    } catch (err) {
      console.error('Error saving assessor comments:', err);
      setError('Failed to save comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter assessments by search term
  const filteredAssessments = employeeAssessments.filter(assessment =>
    assessment.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assessor Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Review employee assessments and manage your assessor profile
            </p>
          </div>
          <button
            onClick={() => setShowNewAssessmentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            New Assessment
          </button>
        </div>

        {/* Employee Assessments Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Employee Assessments</h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : employeeAssessments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                  <UserIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No Assessments Available</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg">
                  There are no completed assessments from your assigned employees yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {employeeAssessments.map(assessment => (
                <div
                  key={assessment.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {assessment.employeeName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {assessment.departmentName || 'No Department'}
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
                        Completed on {formatDate(assessment.lastUpdated)}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {assessment.competencyRatings.length} competencies rated
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        // Handle view employee assessment
                        console.log('View employee assessment:', assessment.id);
                      }}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      View Assessment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assessor Performance Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Assessor Performance</h2>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by assessor name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <UserIcon className="absolute left-3 top-1/2 h-5 w-5 text-gray-400 -translate-y-1/2" />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <ChartBarIcon className="h-5 w-5" />
              </button>
              <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <DocumentCheckIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Assessment Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {assessment.assessor.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {assessment.assessor.role}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium">
                    {getStatusIcon(assessment.status)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Assessments</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assessment.metrics.totalAssessments}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-5 w-5 text-yellow-400" />
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {assessment.metrics.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Consistency Score</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assessment.metrics.consistencyScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Feedback Score</p>
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-5 w-5 text-yellow-400" />
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {assessment.metrics.feedbackScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedAssessment(assessment);
                      setShowDetailsModal(true);
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    View Details
                  </button>
                  <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Assessor Assesments Review
                    </h2>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      {selectedAssessment.assessor.name} - Last Review: {selectedAssessment.lastReview}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Assessor Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </label>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {selectedAssessment.assessor.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Role
                        </label>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {selectedAssessment.assessor.role}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Department
                        </label>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {selectedAssessment.assessor.department}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Performance Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Assessments</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedAssessment.metrics.totalAssessments}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-5 w-5 text-yellow-400" />
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedAssessment.metrics.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Consistency Score</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedAssessment.metrics.consistencyScore}%
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Feedback Score</p>
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-5 w-5 text-yellow-400" />
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedAssessment.metrics.feedbackScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Feedback Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {selectedAssessment.feedback.positive.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5" />
                            <span className="text-sm text-green-700 dark:text-green-300">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-3">
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {selectedAssessment.feedback.areasForImprovement.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ArrowPathIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-0.5" />
                            <span className="text-sm text-yellow-700 dark:text-yellow-300">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Close
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg">
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Assessment Modal */}
        {showNewAssessmentModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-24 pb-8">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      New Assessor Assessment
                    </h2>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Create a new assessor performance evaluation
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewAssessmentModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assessor Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter assessor name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter role"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter department"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Review Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Performance Metrics
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Total Assessments
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          placeholder="Enter total assessments"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Average Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          placeholder="Enter average rating"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Consistency Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          placeholder="Enter consistency score"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Feedback Score
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          placeholder="Enter feedback score"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Feedback
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">
                          Strengths
                        </h4>
                        <div className="space-y-2">
                          {[1, 2, 3].map((index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5" />
                              <input
                                type="text"
                                className="flex-1 px-3 py-1.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:border-green-800 dark:bg-green-900/50 dark:text-green-100"
                                placeholder={`Strength ${index}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-3">
                          Areas for Improvement
                        </h4>
                        <div className="space-y-2">
                          {[1, 2, 3].map((index) => (
                            <div key={index} className="flex items-start gap-2">
                              <ArrowPathIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-0.5" />
                              <input
                                type="text"
                                className="flex-1 px-3 py-1.5 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:border-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100"
                                placeholder={`Area for improvement ${index}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewAssessmentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg">
                  Create Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}