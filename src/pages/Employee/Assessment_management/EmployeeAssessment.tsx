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
  employeeFullName: string;
  departmentId: string | null;
  departmentName: string;
  jobRoleId: string | null;
  jobRoleName: string;
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
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [jobRoles, setJobRoles] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedJobRoleId, setSelectedJobRoleId] = useState<string>('');

  // UI state
  const [activeCompetencyIndex, setActiveCompetencyIndex] = useState<number>(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [currentComments, setCurrentComments] = useState<string>('');

  // State for employee full name input
  const [employeeFullName, setEmployeeFullName] = useState<string>('');

  // Function to start a new assessment
  const startNewAssessment = async () => {
    if (!employeeFullName.trim()) {
      setError('Please enter your full name to continue');
      return;
    }

    if (!selectedDepartmentId) {
      setError('Please select a department to continue');
      return;
    }

    if (!selectedJobRoleId) {
      setError('Please select a job role to continue');
      return;
    }

    try {
      setLoading(true);

      // Create a new assessment with department and job role selection
      const newAssessment: Assessment = {
        employeeId: user?.id || null,
        employeeName: user?.email?.split('@')[0] || 'Current User',
        employeeFullName: employeeFullName || '',
        departmentId: selectedDepartmentId || null,
        departmentName: departments.find(d => d.id === selectedDepartmentId)?.name || '',
        jobRoleId: selectedJobRoleId || null,
        jobRoleName: jobRoles.find(r => r.id === selectedJobRoleId)?.name || '',
        startDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'in_progress',
        progress: 0,
        competencyRatings: []
      };

      // Save to localStorage
      localStorage.setItem('assessment_form_data', JSON.stringify({
        employeeFullName,
        departmentId: selectedDepartmentId,
        jobRoleId: selectedJobRoleId
      }));

      // Create metadata object
      const metadata = {
        employee_full_name: employeeFullName
      };

      // Get department and job role information
      const selectedDepartment = departments.find(d => d.id === selectedDepartmentId);
      const selectedJobRole = jobRoles.find(r => r.id === selectedJobRoleId);

      console.log("Selected department:", selectedDepartment);
      console.log("Selected job role:", selectedJobRole);

      // Create the base assessment object
      const assessmentData: any = {
        employee_id: user?.id || null,
        employee_name: user?.email || 'Current User',
        employee_email: user?.email || '',
        department_id: selectedDepartmentId || null,
        department_name: selectedDepartment?.name || '',
        job_role_id: selectedJobRoleId || null,
        job_role_name: selectedJobRole?.name || '',
        start_date: newAssessment.startDate,
        last_updated: newAssessment.lastUpdated,
        status: 'in_progress',
        progress: 0,
        created_at: new Date().toISOString(),
        competency_ratings: [],
        // Store all the data in metadata as a fallback
        metadata: {
          ...metadata,
          employee_full_name: employeeFullName,
          job_role_id: selectedJobRoleId,
          job_role_name: selectedJobRole?.name
        }
      };

      // Add the new columns directly
      assessmentData.employee_full_name = employeeFullName;
      assessmentData.job_role_id = selectedJobRoleId || null;
      assessmentData.job_role_name = selectedJobRole?.name || '';

      console.log("Saving assessment with data:", assessmentData);

      const { data, error } = await supabase
        .from('employee_assessments')
        .insert(assessmentData)
        .select();

      if (error) {
        console.error("Error inserting assessment:", error);
        throw error;
      }

      console.log("Assessment created successfully:", data);

      // Update the assessment with the ID from Supabase
      if (data && data.length > 0) {
        newAssessment.id = data[0].id;
      }

      setAssessment(newAssessment);
      setShowRatingModal(true);
      setActiveCompetencyIndex(0);

    } catch (err) {
      console.error('Error starting assessment:', err);
      setError('Failed to start assessment. Please try again.');
    } finally {
      setLoading(false);
    }
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
          // Get the current assessment to preserve metadata
          const { data: currentAssessment, error: fetchError } = await supabase
            .from('employee_assessments')
            .select('metadata')
            .eq('id', assessment.id)
            .single();

          if (fetchError) throw fetchError;

          // Update or create metadata
          const metadata = currentAssessment?.metadata || {};
          metadata.employee_full_name = updatedAssessment.employeeFullName || '';

          // Update the assessment
          const { error: updateError } = await supabase
            .from('employee_assessments')
            .update({
              progress: updatedAssessment.progress,
              last_updated: updatedAssessment.lastUpdated,
              metadata: metadata
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
        // Get the current assessment to preserve metadata
        const { data: currentAssessment, error: fetchError } = await supabase
          .from('employee_assessments')
          .select('metadata')
          .eq('id', assessment.id)
          .single();

        if (fetchError) throw fetchError;

        // Update or create metadata
        const metadata = currentAssessment?.metadata || {};
        metadata.employee_full_name = finalAssessment.employeeFullName || '';

        // Update the assessment with all data in a single record
        const { error: updateError } = await supabase
          .from('employee_assessments')
          .update({
            status: 'completed',
            last_updated: now,
            progress: finalAssessment.progress,
            competency_ratings: validCompetencyRatings,
            metadata: metadata
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

        // Create metadata object to store additional information
        const metadata = {
          employee_full_name: finalAssessment.employeeFullName || ''
        };

        // Get department and job role information
        const selectedDepartment = departments.find(d => d.id === finalAssessment.departmentId);
        const selectedJobRole = jobRoles.find(r => r.id === finalAssessment.jobRoleId);

        console.log("Selected department for submission:", selectedDepartment);
        console.log("Selected job role for submission:", selectedJobRole);

        // Save new assessment to Supabase with all data in a single record
        const { data, error } = await supabase
          .from('employee_assessments')
          .insert({
            employee_id: user?.id || null,
            employee_name: user?.email || 'Employee',
            employee_email: user?.email || '',
            employee_full_name: finalAssessment.employeeFullName,
            department_id: finalAssessment.departmentId || profileData?.department_id || null,
            department_name: finalAssessment.departmentName || profileData?.department_name || '',
            job_role_id: finalAssessment.jobRoleId || null,
            job_role_name: finalAssessment.jobRoleName || selectedJobRole?.name || '',
            start_date: finalAssessment.startDate || now.split('T')[0],
            last_updated: now,
            status: 'completed',
            progress: finalAssessment.progress,
            created_at: now,
            competency_ratings: validCompetencyRatings,
            metadata: metadata // Store the full name in the metadata field
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

        // Clear localStorage
        localStorage.removeItem('assessment_form_data');
      }

    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch departments from the departments table
  const fetchDepartments = async () => {
    try {
      console.log("Fetching departments...");

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('id', { ascending: true }); // Order by ID to match HR Role Management

      if (error) {
        console.error("Error fetching departments:", error);
        throw error;
      }

      console.log("Fetched departments:", data);
      setDepartments(data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  // Function to fetch job roles from the job_roles table
  const fetchJobRoles = async () => {
    try {
      console.log("Fetching job roles...");

      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .order('id', { ascending: true }); // Order by ID to match HR Role Management

      if (error) {
        console.error("Error fetching job roles:", error);
        throw error;
      }

      console.log("Fetched job roles:", data);
      setJobRoles(data || []);
    } catch (err) {
      console.error("Error fetching job roles:", err);
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

        // Fetch departments and job roles first to ensure they're available
        console.log("Loading departments and job roles...");
        await Promise.all([
          fetchDepartments(),
          fetchJobRoles()
        ]);

        // Load saved form data from localStorage if available
        if (typeof window !== 'undefined') {
          const savedFormData = localStorage.getItem('assessment_form_data');
          if (savedFormData) {
            try {
              const parsedData = JSON.parse(savedFormData);
              console.log('Loaded form data from localStorage:', parsedData);

              // Set the department and job role IDs from localStorage
              if (parsedData.departmentId) {
                setSelectedDepartmentId(parsedData.departmentId);
              }

              if (parsedData.jobRoleId) {
                setSelectedJobRoleId(parsedData.jobRoleId);
              }

              if (parsedData.employeeFullName) {
                setEmployeeFullName(parsedData.employeeFullName);
              }
            } catch (error) {
              console.error('Error parsing saved form data:', error);
            }
          }
        }

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

        // Check if the user already has an assessment (either in-progress or completed)
        if (user?.id) {
          console.log("Checking for existing assessments for user:", user.id);

          // First, try to find a completed assessment
          const { data: completedAssessmentData, error: completedAssessmentError } = await supabase
            .from('employee_assessments')
            .select('*')
            .eq('employee_id', user.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1);

          if (completedAssessmentError) {
            console.error("Error fetching completed assessment:", completedAssessmentError);
            throw completedAssessmentError;
          }

          // If no completed assessment, look for in-progress assessment
          const { data: inProgressAssessmentData, error: inProgressAssessmentError } = await supabase
            .from('employee_assessments')
            .select('*')
            .eq('employee_id', user.id)
            .eq('status', 'in_progress')
            .order('created_at', { ascending: false })
            .limit(1);

          if (inProgressAssessmentError) {
            console.error("Error fetching in-progress assessment:", inProgressAssessmentError);
            throw inProgressAssessmentError;
          }

          // Prioritize completed assessment over in-progress
          const assessmentData = completedAssessmentData && completedAssessmentData.length > 0
            ? completedAssessmentData
            : inProgressAssessmentData;

          console.log("Found assessment data:", assessmentData);

          if (assessmentData && assessmentData.length > 0) {
            // User has an existing assessment
            const existingAssessment = assessmentData[0];

            // Get competency ratings from the assessment data
            const competencyRatings = existingAssessment.competency_ratings || [];

            // Extract metadata if it exists
            const metadata = existingAssessment.metadata || {};
            const fullName = metadata.employee_full_name || '';

            // Get job role information from metadata if not in the main record
            let jobRoleId = existingAssessment.job_role_id || null;
            let jobRoleName = existingAssessment.job_role_name || '';

            // If job role info is in metadata, use it
            if (!jobRoleId && metadata.job_role_id) {
              jobRoleId = metadata.job_role_id;
              console.log("Using job role ID from metadata:", jobRoleId);
            }

            if (!jobRoleName && metadata.job_role_name) {
              jobRoleName = metadata.job_role_name;
              console.log("Using job role name from metadata:", jobRoleName);
            }

            // If we have job role ID but no name, try to get it from jobRoles
            if (jobRoleId && !jobRoleName) {
              // Fetch job roles first if not already loaded
              if (jobRoles.length === 0) {
                await fetchJobRoles();
              }

              const jobRole = jobRoles.find(r => r.id === jobRoleId);
              if (jobRole) {
                jobRoleName = jobRole.name;
                console.log("Found job role name from jobRoles:", jobRoleName);
              }
            }

            console.log("Final job role info:", { jobRoleId, jobRoleName });

            // Convert the Supabase data to our Assessment type
            const assessment: Assessment = {
              id: existingAssessment.id,
              employeeId: existingAssessment.employee_id,
              employeeName: existingAssessment.employee_name,
              employeeFullName: fullName,
              departmentId: existingAssessment.department_id || null,
              departmentName: existingAssessment.department_name || '',
              jobRoleId: jobRoleId,
              jobRoleName: jobRoleName,
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

            // Set the department and job role IDs from the assessment
            if (existingAssessment.department_id) {
              setSelectedDepartmentId(existingAssessment.department_id);
            }

            if (jobRoleId) {
              setSelectedJobRoleId(jobRoleId);
            }

            // Update the full name state if it exists in the metadata
            if (fullName) {
              setEmployeeFullName(fullName);
            }

            // Make sure job roles are loaded before setting the assessment
            if (jobRoles.length === 0) {
              console.log("Fetching job roles before setting assessment...");
              await fetchJobRoles();

              // Try to update job role name if we have the ID but not the name
              if (jobRoleId && !jobRoleName) {
                const jobRole = jobRoles.find(r => r.id === jobRoleId);
                if (jobRole) {
                  assessment.jobRoleName = jobRole.name;
                  console.log("Updated job role name from fetched job roles:", jobRole.name);
                }
              }
            }

            console.log("Setting assessment with job role:", assessment.jobRoleName);
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
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your assessment data...</p>
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

                <div className="w-full max-w-md space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="fullName"
                        value={employeeFullName}
                        onChange={(e) => {
                          setEmployeeFullName(e.target.value);

                          // Save to localStorage
                          const formData = {
                            employeeFullName: e.target.value,
                            departmentId: selectedDepartmentId,
                            jobRoleId: selectedJobRoleId
                          };
                          localStorage.setItem('assessment_form_data', JSON.stringify(formData));

                          if (error) setError(null); // Clear any error when user types
                        }}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                      {employeeFullName && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-500">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="department"
                        value={selectedDepartmentId}
                        onChange={(e) => {
                          setSelectedDepartmentId(e.target.value);

                          // Save to localStorage
                          const formData = {
                            employeeFullName,
                            departmentId: e.target.value,
                            jobRoleId: selectedJobRoleId
                          };
                          localStorage.setItem('assessment_form_data', JSON.stringify(formData));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                        required
                      >
                        <option value="">Select a department</option>
                        {departments.length > 0 ? (
                          departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))
                        ) : (
                          <option value="" disabled>Loading departments...</option>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    {departments.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        No departments found. Please contact HR to add departments.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left mb-1">
                      Job Role <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="jobRole"
                        value={selectedJobRoleId}
                        onChange={(e) => {
                          setSelectedJobRoleId(e.target.value);

                          // Save to localStorage
                          const formData = {
                            employeeFullName,
                            departmentId: selectedDepartmentId,
                            jobRoleId: e.target.value
                          };
                          localStorage.setItem('assessment_form_data', JSON.stringify(formData));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                        required
                      >
                        <option value="">Select a job role</option>
                        {jobRoles.length > 0 ? (
                          jobRoles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))
                        ) : (
                          <option value="" disabled>Loading job roles...</option>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    {jobRoles.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        No job roles found. Please contact HR to add job roles.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={startNewAssessment}
                  disabled={!employeeFullName.trim() || !selectedDepartmentId || !selectedJobRoleId}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {assessment.employeeFullName || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                    <p className="mt-1 text-gray-900 dark:text-white capitalize">
                      {assessment.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</h3>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {assessment.departmentName || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Role</h3>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {assessment.jobRoleName ||
                       (assessment.jobRoleId && jobRoles.find(r => r.id === assessment.jobRoleId)?.name) ||
                       'Not specified'}
                    </p>
                    {!assessment.jobRoleName && assessment.jobRoleId && (
                      <button
                        onClick={async () => {
                          // Try to refresh job roles and update the assessment
                          await fetchJobRoles();
                          const jobRole = jobRoles.find(r => r.id === assessment.jobRoleId);
                          if (jobRole && assessment) {
                            setAssessment({
                              ...assessment,
                              jobRoleName: jobRole.name
                            });
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1"
                      >
                        Refresh job role
                      </button>
                    )}
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
                    {assessment.status === 'completed' && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Assessment is completed and locked
                      </div>
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
                  {assessment.status === 'completed' ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Assessment completed on {formatDate(assessment.lastUpdated)}</span>
                    </div>
                  ) : assessment.competencyRatings.length > 0 && (
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
                    disabled={currentRating === 0 || loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      activeCompetencyIndex === competencies.length - 1 ? 'Finish' : 'Next'
                    )}
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
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{assessment.employeeFullName || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{assessment.employeeName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(assessment.startDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{assessment.departmentName || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Role</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {assessment.jobRoleName ||
                         (assessment.jobRoleId && jobRoles.find(r => r.id === assessment.jobRoleId)?.name) ||
                         'Not specified'}
                      </p>
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
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Submit Assessment"
                    )}
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