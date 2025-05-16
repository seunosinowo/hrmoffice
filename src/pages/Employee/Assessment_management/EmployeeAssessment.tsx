import { useState, useEffect } from 'react';
import { UserIcon } from "../../../icons";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

// Types
interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface CompetencyRating {
  id?: string;
  competencyId: string;
  rating: number;
  comments: string;
}

interface Assessment {
  id?: string;
  employeeId: string | null;
  employeeName: string;
  departmentId: string | null;
  departmentName: string;
  startDate: string;
  lastUpdated: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'reviewed';
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

// Calculate progress percentage
const calculateProgress = (ratings: CompetencyRating[], totalCompetencies: number): number => {
  if (!ratings || totalCompetencies === 0) return 0;
  const ratedCompetencies = ratings.filter(r => r.rating > 0).length;
  return Math.round((ratedCompetencies / totalCompetencies) * 100);
};



export default function EmployeeAssessment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assessment data
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);

  // UI state
  const [activeCompetencyIndex, setActiveCompetencyIndex] = useState<number>(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [currentComments, setCurrentComments] = useState<string>('');

  // Function to start a new assessment
  const startNewAssessment = () => {
    // Create a new assessment without department selection
    const newAssessment: Assessment = {
      employeeId: user?.id || null,
      employeeName: user?.email?.split('@')[0] || 'Current User',
      departmentId: null,
      departmentName: '',
      startDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      progress: 0,
      competencyRatings: []
    };

    setAssessment(newAssessment);
    setShowRatingModal(true);
    setActiveCompetencyIndex(0);
  };

  // Function to check if assessment is locked (created more than 24 hours ago)
  const isAssessmentLocked = (assessment: Assessment): boolean => {
    const creationDate = new Date(assessment.startDate);
    const now = new Date();
    const hoursDifference = (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60);
    return hoursDifference > 24 || assessment.status === 'completed' || assessment.status === 'reviewed';
  };

  // Function to handle competency rating
  const handleCompetencyRating = (rating: number, comments: string) => {
    if (!assessment || !competencies[activeCompetencyIndex]) return;

    // Check if assessment is locked
    if (isAssessmentLocked(assessment)) {
      setError('This assessment is locked and cannot be edited (created more than 24 hours ago).');
      setShowRatingModal(false);
      return;
    }

    const competency = competencies[activeCompetencyIndex];

    // Update the assessment with the new rating
    const updatedRatings = [...assessment.competencyRatings];
    const existingRatingIndex = updatedRatings.findIndex(r => r.competencyId === competency.id);

    if (existingRatingIndex >= 0) {
      updatedRatings[existingRatingIndex] = {
        ...updatedRatings[existingRatingIndex],
        rating,
        comments
      };
    } else {
      updatedRatings.push({
        competencyId: competency.id,
        rating,
        comments
      });
    }

    // Calculate progress
    const progress = calculateProgress(updatedRatings, competencies.length);

    // Update the assessment
    const updatedAssessment: Assessment = {
      ...assessment,
      competencyRatings: updatedRatings,
      progress,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    // Save the updated assessment to Supabase
    const saveRating = async () => {
      try {
        // If the assessment has an ID, update it in Supabase
        if (assessment.id) {
          // Update the assessment
          const { error: updateError } = await supabase
            .from('employee_assessments')
            .update({
              progress: updatedAssessment.progress,
              last_updated: updatedAssessment.lastUpdated
            })
            .eq('id', assessment.id);

          if (updateError) throw updateError;

          // Update or insert the competency rating
          if (existingRatingIndex >= 0 && updatedRatings[existingRatingIndex].id) {
            // Update existing rating
            const { error: ratingError } = await supabase
              .from('employee_competency_ratings')
              .update({
                rating: rating,
                comments: comments,
                updated_at: new Date().toISOString()
              })
              .eq('id', updatedRatings[existingRatingIndex].id);

            if (ratingError) throw ratingError;
          } else {
            // Insert new rating
            const { error: ratingError } = await supabase
              .from('employee_competency_ratings')
              .insert({
                assessment_id: assessment.id,
                competency_id: competency.id,
                rating: rating,
                comments: comments,
                created_at: new Date().toISOString()
              });

            if (ratingError) throw ratingError;
          }
        }
      } catch (err) {
        console.error('Error saving rating:', err);
        // Continue with UI updates even if save fails
      }
    };

    // Save in background
    saveRating();

    setAssessment(updatedAssessment);

    // Move to the next competency or show summary
    if (activeCompetencyIndex < competencies.length - 1) {
      setActiveCompetencyIndex(activeCompetencyIndex + 1);
    } else {
      setShowRatingModal(false);
      setShowSummaryModal(true);
    }
  };

  // Set current rating and comments when active competency changes
  useEffect(() => {
    if (assessment && competencies[activeCompetencyIndex]) {
      const competency = competencies[activeCompetencyIndex];
      const existingRating = assessment.competencyRatings.find(r => r.competencyId === competency.id);

      if (existingRating) {
        setCurrentRating(existingRating.rating);
        setCurrentComments(existingRating.comments || '');
      } else {
        setCurrentRating(0);
        setCurrentComments('');
      }
    }
  }, [activeCompetencyIndex, assessment, competencies]);

  // Function to submit the assessment
  const submitAssessment = async () => {
    if (!assessment) return;

    // Check if assessment is locked
    if (isAssessmentLocked(assessment)) {
      setError('This assessment is locked and cannot be submitted (created more than 24 hours ago).');
      setShowSummaryModal(false);
      return;
    }

    try {
      setLoading(true);

      // Update the assessment status
      const finalAssessment: Assessment = {
        ...assessment,
        status: 'completed',
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      const now = new Date().toISOString();

      // Make sure we have valid competency ratings
      const validCompetencyRatings = finalAssessment.competencyRatings
        .filter(rating => rating.rating > 0)
        .map(rating => ({
          id: rating.id || crypto.randomUUID(),
          competency_id: rating.competencyId,
          rating: rating.rating,
          comments: rating.comments || '',
          created_at: now
        }));

      // If assessment already exists in Supabase, update it
      if (assessment.id) {
        // Update the assessment with all data in a single record
        const { error: updateError } = await supabase
          .from('employee_assessments')
          .update({
            status: 'completed',
            last_updated: now,
            progress: finalAssessment.progress,
            competency_ratings: validCompetencyRatings
          })
          .eq('id', assessment.id);

        if (updateError) throw updateError;

        // Update UI
        setAssessment(finalAssessment);
        setShowSummaryModal(false);
        setShowSuccessModal(true);
      } else {
        // Get user profile to ensure we have department info
        const { data: profileData, error: profileError } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - this is fine if user doesn't have a profile yet
          throw profileError;
        }

        // Save new assessment to Supabase with all data in a single record
        const { data, error } = await supabase
          .from('employee_assessments')
          .insert({
            employee_id: user?.id || null,
            employee_name: user?.email?.split('@')[0] || 'Employee',
            employee_email: user?.email || '',
            department_id: profileData?.department_id || null,
            department_name: profileData?.department_name || '',
            start_date: finalAssessment.startDate || now.split('T')[0],
            last_updated: now,
            status: 'completed',
            progress: finalAssessment.progress,
            created_at: now,
            competency_ratings: validCompetencyRatings
          })
          .select()
          .single();

        if (error) throw error;

        // Update the assessment with the ID from Supabase
        if (data) {
          finalAssessment.id = data.id;
        }

        // Update UI
        setAssessment(finalAssessment);
        setShowSummaryModal(false);
        setShowSuccessModal(true);
      }

    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Function to set mock competencies
  const setMockCompetencies = () => {
    const mockCompetencies: Competency[] = [
      {
        id: '1',
        name: 'Communication',
        description: 'Ability to convey information clearly and effectively',
        category: 'Interpersonal Skills'
      },
      {
        id: '2',
        name: 'Problem Solving',
        description: 'Ability to identify issues and implement effective solutions',
        category: 'Technical Skills'
      },
      {
        id: '3',
        name: 'Leadership',
        description: 'Ability to guide and motivate team members',
        category: 'Management Skills'
      },
      {
        id: '4',
        name: 'Technical Skills',
        description: 'Proficiency in job-specific tools and technologies',
        category: 'Technical Skills'
      },
      {
        id: '5',
        name: 'Teamwork',
        description: 'Ability to collaborate effectively with others',
        category: 'Interpersonal Skills'
      }
    ];
    setCompetencies(mockCompetencies);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Use mock competencies for now since we're using a single table approach
        // In a real implementation, you would store competency data in the employee_assessments table
        // or fetch it from another source

        // Check if there are any template assessments with competencies
        const { data: templateData, error: templateError } = await supabase
          .from('employee_assessments')
          .select('competency_data')
          .eq('status', 'template')
          .limit(1);

        if (templateError) throw templateError;

        if (templateData && templateData.length > 0 && templateData[0].competency_data) {
          // Parse the competency data from the template
          try {
            const parsedCompetencies = templateData[0].competency_data;
            setCompetencies(parsedCompetencies);
          } catch (parseError) {
            console.error('Error parsing competency data:', parseError);
            // Fall back to mock data
            setMockCompetencies();
          }
        } else {
          // Fallback to mock data if no competencies found
          setMockCompetencies();
        }

        // Check if the user already has an assessment
        if (user?.id) {
          const { data: assessmentData, error: assessmentError } = await supabase
            .from('employee_assessments')
            .select('*')
            .eq('employee_id', user.id)
            .eq('status', 'in_progress')
            .order('created_at', { ascending: false })
            .limit(1);

          if (assessmentError) throw assessmentError;

          if (assessmentData && assessmentData.length > 0) {
            // User has an existing in-progress assessment
            const existingAssessment = assessmentData[0];

            // Get competency ratings from the assessment data
            const competencyRatings = existingAssessment.competency_ratings || [];

            // Convert the Supabase data to our Assessment type
            const assessment: Assessment = {
              id: existingAssessment.id,
              employeeId: existingAssessment.employee_id,
              employeeName: existingAssessment.employee_name,
              departmentId: existingAssessment.department_id || null,
              departmentName: existingAssessment.department_name || '',
              startDate: existingAssessment.start_date,
              lastUpdated: existingAssessment.last_updated,
              status: existingAssessment.status,
              progress: existingAssessment.progress,
              competencyRatings: competencyRatings.map((rating: any) => ({
                id: rating.id,
                competencyId: rating.competency_id,
                rating: rating.rating,
                comments: rating.comments || ''
              }))
            };

            setAssessment(assessment);
          }
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please refresh the page or contact support.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);





  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">My Competency Assessment</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {assessment
                  ? "View and manage your competency self-assessment"
                  : "Create your competency self-assessment"}
              </p>
            </div>
          </div>

          {/* Start Assessment Section */}
          {!assessment && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <div className="flex flex-col items-center justify-center space-y-6 text-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                  <UserIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Start Your Competency Assessment</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg">
                  This assessment will help you evaluate your skills and competencies across different areas.
                  Your responses will be used to create a personalized development plan.
                </p>
                <button
                  onClick={startNewAssessment}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          )}

          {/* Assessment in Progress */}
          {assessment && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                {/* Assessment Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Self-Assessment
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Started on {formatDate(assessment.startDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
                        style={{ width: `${assessment.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {assessment.progress}%
                    </span>
                  </div>
                </div>

                {/* Assessment Info */}
                <div className="mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                    <p className="mt-1 text-gray-900 dark:text-white capitalize">
                      {assessment.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Status Message */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {assessment.status === 'completed'
                          ? "Your assessment has been completed. Thank you for your participation."
                          : "Continue your assessment by rating your competencies. Your progress is automatically saved."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Competencies Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Competency Ratings</h3>
                    {assessment.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setActiveCompetencyIndex(0);
                          setShowRatingModal(true);
                        }}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        Continue Assessment
                      </button>
                    )}
                  </div>

                  {assessment.competencyRatings.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No competencies have been rated yet. Click "Continue Assessment" to start rating your competencies.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assessment.competencyRatings.map((rating) => {
                        const competency = competencies.find(c => c.id === rating.competencyId);
                        return (
                          <div key={rating.competencyId} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{competency?.name || 'Unknown Competency'}</h4>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Rating:</span>
                                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-sm font-medium">
                                  {rating.rating}/5
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{rating.comments}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                  {assessment.status !== 'completed' && assessment.competencyRatings.length > 0 && (
                    <button
                      onClick={() => setShowSummaryModal(true)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      Complete Assessment
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rating Modal */}
          {showRatingModal && assessment && activeCompetencyIndex < competencies.length && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-xl rounded-xl bg-white dark:bg-gray-900 max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Rate Your Competency
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {activeCompetencyIndex + 1} of {competencies.length}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {competencies[activeCompetencyIndex].name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {competencies[activeCompetencyIndex].description}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      Category: {competencies[activeCompetencyIndex].category}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => {
                        // Find if this competency already has a rating
                        const existingRating = assessment.competencyRatings.find(
                          r => r.competencyId === competencies[activeCompetencyIndex].id
                        );
                        const isSelected = existingRating?.rating === rating || currentRating === rating;

                        return (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setCurrentRating(rating)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            } hover:bg-blue-500 hover:text-white transition-colors`}
                          >
                            {rating}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Comments
                    </label>
                    <textarea
                      value={currentComments}
                      onChange={(e) => setCurrentComments(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={4}
                      placeholder="Add your comments about this competency..."
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeCompetencyIndex > 0) {
                        setActiveCompetencyIndex(activeCompetencyIndex - 1);
                        setCurrentRating(0);
                        setCurrentComments('');
                      }
                    }}
                    disabled={activeCompetencyIndex === 0}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCompetencyRating(currentRating, currentComments);
                      setCurrentRating(0);
                      setCurrentComments('');
                    }}
                    disabled={currentRating === 0}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
                  >
                    {activeCompetencyIndex === competencies.length - 1 ? 'Finish' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Modal */}
          {showSummaryModal && assessment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-900 max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Assessment Summary
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Review your assessment before submitting
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{assessment.employeeName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(assessment.startDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{assessment.progress}%</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{assessment.status.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Once you submit this assessment, it will be marked as completed and can no longer be edited.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Competency Ratings</h3>
                    <div className="space-y-4">
                      {assessment.competencyRatings.map((rating) => {
                        const competency = competencies.find(c => c.id === rating.competencyId);
                        return (
                          <div key={rating.competencyId} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">{competency?.name || 'Unknown Competency'}</h4>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Rating:</span>
                                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-sm font-medium">
                                  {rating.rating}/5
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{rating.comments}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowSummaryModal(false)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitAssessment}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    Submit Assessment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 text-center p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Assessment Completed!</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Your competency assessment has been successfully submitted. Thank you for your participation.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSuccessModal(false)}
                    className="inline-flex w-full justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}




        </>
      )}
    </div>
  );
}