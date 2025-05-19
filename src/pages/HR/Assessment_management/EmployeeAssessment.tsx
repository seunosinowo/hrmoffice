import { useState, useEffect } from 'react';
import {
  UserIcon,
  FileIcon,
  ChatIcon
} from "../../../icons";
import { supabase } from "../../../lib/supabase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface Employee {
  name: string;
  department: {
    id: string;
    name: string;
  }[];
}

interface Competency {
  id: string;
  name: string;
}

interface AssessmentCompetency {
  id: string;
  rating: number;
  comments: string;
  competency: {
    id: string;
    name: string;
  };
}

interface Assessment {
  id: string;
  employee: Employee;
  assessor_name: string;
  assessment_date: string;
  status: 'In Progress' | 'Approved' | 'Completed'; // Added 'Completed' as a valid status
  overall_rating: number;
  isEdited: boolean;
  competencies: AssessmentCompetency[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

export default function EmployeeAssessment() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewAssessmentModal, setShowNewAssessmentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<{
    employee_name: string;
    assessor_name: string;
    assessment_date: string;
    status: 'In Progress' | 'Approved' | 'Completed'; // Added 'Completed' as a valid status
    overall_rating: number;
    department_id: string;
    competencies: {
      id: string;
      rating: number;
      comments: string;
      competency: Competency;
    }[];
  }>({
    employee_name: '',
    assessor_name: '',
    assessment_date: new Date().toISOString().split('T')[0],
    status: 'In Progress',
    overall_rating: 0,
    department_id: '',
    competencies: []
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch departments from Supabase
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departments')
          .select('*');

        if (departmentsError) throw departmentsError;

        if (departmentsData && departmentsData.length > 0) {
          setDepartments(departmentsData);
        } else {
          // Fallback to mock data if no departments found
          const mockDepartments = [
            { id: '1', name: 'Engineering' },
            { id: '2', name: 'Marketing' },
            { id: '3', name: 'Human Resources' },
            { id: '4', name: 'Finance' },
            { id: '5', name: 'Operations' }
          ];
          setDepartments(mockDepartments);
        }

        // Use the standard competencies that match what employees fill out
        const standardCompetencies = [
          { id: '1', name: 'Communication' },
          { id: '2', name: 'Problem Solving' },
          { id: '3', name: 'Leadership' },
          { id: '4', name: 'Technical Skills' },
          { id: '5', name: 'Teamwork' }
        ];
        setCompetencies(standardCompetencies);

        // Fetch assessments from Supabase
        await fetchAssessments();

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please refresh the page or contact support.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all employee assessments
      const { data, error } = await supabase
        .from('employee_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setAssessments([]);
        return;
      }

      // Process assessments
      console.log('Competencies available:', competencies);
      console.log('Raw assessment data:', data);

      const processedAssessments = data.map(assessment => {
        // Get department info
        const department = departments.find(d => d.id === assessment.department_id);

        // Get competency ratings from the assessment data
        const competencyRatings = assessment.competency_ratings || [];
        console.log('Competency ratings for assessment:', assessment.id, competencyRatings);

        // Map competency ratings to the expected format
        const mappedCompetencies = competencyRatings.map((rating: any) => {
          console.log('Processing rating:', rating);

          // Find competency details by ID or try to match by position
          let competency = competencies.find(c => c.id === rating.competency_id);
          console.log('Found competency by ID:', competency);

          // If not found by ID, try to match by position (1-based index)
          if (!competency && !isNaN(Number(rating.competency_id))) {
            const index = Number(rating.competency_id) - 1;
            if (index >= 0 && index < competencies.length) {
              competency = competencies[index];
              console.log('Found competency by position:', competency);
            }
          }

          // Hard-code the competency name based on the ID
          let competencyName;
          if (rating.competency_id === '1' || rating.competency_id === 1) {
            competencyName = 'Communication';
          } else if (rating.competency_id === '2' || rating.competency_id === 2) {
            competencyName = 'Problem Solving';
          } else if (rating.competency_id === '3' || rating.competency_id === 3) {
            competencyName = 'Leadership';
          } else if (rating.competency_id === '4' || rating.competency_id === 4) {
            competencyName = 'Technical Skills';
          } else if (rating.competency_id === '5' || rating.competency_id === 5) {
            competencyName = 'Teamwork';
          } else {
            competencyName = competency ? competency.name : `Competency ${rating.competency_id}`;
          }

          console.log('Final competency name:', competencyName);

          return {
            id: rating.id,
            rating: rating.rating || 0,
            comments: rating.comments || '',
            competency: {
              id: rating.competency_id,
              name: competencyName
            }
          };
        });

        // Calculate overall rating
        const overallRating = mappedCompetencies.length > 0
          ? mappedCompetencies.reduce((sum: number, comp: any) => sum + (comp.rating || 0), 0) / mappedCompetencies.length
          : 0;

        // Get employee full name from metadata or employee_full_name field
        const metadata = assessment.metadata || {};
        const fullName = assessment.employee_full_name || metadata.employee_full_name || assessment.employee_name;

        // Map to Assessment type
        return {
          id: assessment.id,
          employee: {
            name: fullName, // Use full name instead of email
            department: assessment.department_id ? [{
              id: assessment.department_id,
              name: department?.name || assessment.department_name || 'Unknown Department'
            }] : []
          },
          assessor_name: assessment.assessor_name || '',
          assessment_date: assessment.start_date || assessment.created_at,
          status: assessment.status === 'completed' ? 'Completed' as const : 'In Progress' as const, // Changed from 'Approved' to 'Completed'
          overall_rating: Number(overallRating.toFixed(1)),
          isEdited: false,
          competencies: mappedCompetencies
        };
      });

      setAssessments(processedAssessments);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load assessments. Please refresh the page or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallRating = (competencies: { rating: number }[]) => {
    if (competencies.length === 0) return 0;
    const sum = competencies.reduce((total, comp) => total + (comp.rating || 0), 0);
    return Number((sum / competencies.length).toFixed(1));
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!formData.employee_name || !formData.assessor_name) {
        setError('Please fill in all required fields');
        return;
      }

      const department = departments.find(d => d.id === formData.department_id);
      const now = new Date().toISOString();
      const status = formData.status === 'Completed' ? 'completed' : 'in_progress';

      // Filter competencies with ratings
      const competencyRatings = formData.competencies
        .filter(comp => comp.rating > 0) // Only include competencies with ratings
        .map(comp => ({
          id: crypto.randomUUID(),
          competency_id: comp.id,
          rating: comp.rating,
          comments: comp.comments,
          created_at: now
        }));

      // Insert assessment with competency ratings in a single record
      const { data: assessment, error: assessmentError } = await supabase
        .from('employee_assessments')
        .insert({
          employee_id: '', // This would normally be the user ID
          employee_name: formData.employee_name,
          employee_email: '',
          assessor_name: formData.assessor_name,
          department_id: formData.department_id,
          department_name: department?.name || '',
          start_date: formData.assessment_date.split('T')[0],
          last_updated: now,
          status: status,
          progress: 100, // Since HR is creating a complete assessment
          created_at: now,
          competency_ratings: competencyRatings
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create a new assessment object for the UI
      const newAssessment: Assessment = {
        id: assessment.id,
        employee: {
          name: formData.employee_name,
          department: formData.department_id ? [{
            id: formData.department_id,
            name: department?.name || 'Unknown Department'
          }] : []
        },
        assessor_name: formData.assessor_name,
        assessment_date: formData.assessment_date,
        status: formData.status,
        overall_rating: Number(formData.overall_rating) || 0,
        isEdited: false,
        competencies: competencyRatings.map(comp => {
          // Find the competency from our list
          const foundCompetency = competencies.find(c => c.id === comp.competency_id);
          const competencyName = foundCompetency ? foundCompetency.name : `Competency ${comp.competency_id}`;

          return {
            id: comp.id,
            rating: comp.rating,
            comments: comp.comments,
            competency: {
              id: comp.competency_id,
              name: competencyName
            }
          };
        })
      };

      // Add the new assessment to the state
      setAssessments(prevAssessments => [newAssessment, ...prevAssessments]);
      setShowNewAssessmentModal(false);

      // Reset the form
      setFormData({
        employee_name: '',
        assessor_name: '',
        assessment_date: new Date().toISOString().split('T')[0],
        status: 'In Progress',
        overall_rating: 0,
        department_id: '',
        competencies: []
      });

    } catch (err) {
      console.error('Error creating assessment:', err);
      setError('Failed to create assessment. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };


  // Removed unused handleEditClick function to fix compile error.

  const handleEditAssessment = async () => {
    if (!selectedAssessment) return;

    try {
      setLoading(true);
      setError(null);

      const department = departments.find(d => d.id === formData.department_id);
      const now = new Date().toISOString();
      const status = formData.status === 'Completed' ? 'completed' : 'in_progress';

      // Filter competencies with ratings
      const competencyRatings = formData.competencies
        .filter(comp => comp.rating > 0)
        .map(comp => ({
          id: comp.id || crypto.randomUUID(),
          competency_id: comp.id,
          rating: comp.rating,
          comments: comp.comments,
          updated_at: now
        }));

      // Update the existing assessment with all data in a single record
      const { error: updateError } = await supabase
        .from('employee_assessments')
        .update({
          employee_name: formData.employee_name,
          assessor_name: formData.assessor_name,
          department_id: formData.department_id,
          department_name: department?.name || '',
          start_date: formData.assessment_date.split('T')[0],
          last_updated: now,
          status: status,
          progress: 100, // Since HR is updating a complete assessment
          competency_ratings: competencyRatings
        })
        .eq('id', selectedAssessment.id);

      if (updateError) throw updateError;

      // Create updated assessment object for the UI
      const updatedAssessment: Assessment = {
        id: selectedAssessment.id,
        employee: {
          name: formData.employee_name,
          department: formData.department_id ? [{
            id: formData.department_id,
            name: department?.name || 'Unknown Department'
          }] : []
        },
        assessor_name: formData.assessor_name,
        assessment_date: formData.assessment_date,
        status: formData.status,
        overall_rating: Number(formData.overall_rating) || 0,
        isEdited: true,
        competencies: competencyRatings.map(comp => {
          // Find the competency from our list
          const foundCompetency = competencies.find(c => c.id === comp.competency_id);
          const competencyName = foundCompetency ? foundCompetency.name : `Competency ${comp.competency_id}`;

          return {
            id: comp.id,
            rating: comp.rating,
            comments: comp.comments,
            competency: {
              id: comp.competency_id,
              name: competencyName
            }
          };
        })
      };

      // Update the state with the updated assessment
      setAssessments(prevAssessments =>
        prevAssessments.map(assessment =>
          assessment.id === selectedAssessment.id ? updatedAssessment : assessment
        )
      );

      setShowNewAssessmentModal(false);
      setSelectedAssessment(null);
    } catch (err) {
      console.error('Error updating assessment:', err);
      setError('Failed to update assessment. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    try {
      setLoading(true);

      // Delete the assessment (competency ratings are stored in the same record)
      const { error } = await supabase
        .from('employee_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the UI by removing the deleted assessment
      setAssessments(prevAssessments =>
        prevAssessments.filter(assessment => assessment.id !== id)
      );

      setShowDeleteModal(false);
      setAssessmentToDelete(null);
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setError('Failed to delete assessment. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = (assessment: Assessment) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185); // Blue color for title
    doc.text('Employee Competency Self-Assessment', 14, 15);

    // Add subtitle
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.text('Assessment Report', 14, 25);

    // Add assessment details
    doc.setFontSize(12);
    doc.text(`Employee: ${assessment.employee.name}`, 14, 40);
    doc.text(`Department: ${assessment.employee.department[0]?.name || 'N/A'}`, 14, 50);
    doc.text(`Assessment Date: ${formatDate(assessment.assessment_date)}`, 14, 60);
    doc.text(`Status: ${assessment.status}`, 14, 70);
    doc.text(`Overall Rating: ${assessment.overall_rating.toFixed(1)} / 5.0`, 14, 80);

    // Add competencies table
    const tableData = assessment.competencies.map(comp => [
        comp.competency.name,
        comp.rating.toString(),
        comp.comments || 'N/A'
    ]);

    autoTable(doc, {
        startY: 90,
        head: [['Competency', 'Rating', 'Comments']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
    });

    // Add footer
    const pageCount = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`Competency_Assessment_${assessment.employee.name}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.employee.department.some(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Status colors are now defined inline in the JSX

  const handleCompetencyRatingChange = (id: string, rating: number) => {
    const updatedCompetencies = formData.competencies.map(comp =>
      comp.id === id ? { ...comp, rating } : comp
    );
    setFormData({
      ...formData,
      competencies: updatedCompetencies,
      overall_rating: calculateOverallRating(updatedCompetencies)
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assessment data...</p>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Employee Competency Assessment</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">View employee competency self-assessments</p>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
                placeholder="Search by employee name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* <button
                onClick={handleNewAssessmentClick}
                className="flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                + Add Assessment
              </button> */}
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]">
                <FileIcon className="h-4 w-4" />
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]">
                <ChatIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Assessment Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800/50"
              >
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-blue-600 to-purple-600" />

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-2"> {/* Added margin-right for spacing */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                      {assessment.employee.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                      {assessment.employee.department.map(dept => dept.name).join(', ')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    assessment.status === 'Completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    <span>
                      {assessment.status === 'Completed' ? (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      )}
                    </span>
                    {assessment.status}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Rating</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {assessment.overall_rating || 0}
                      </span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <ChatIcon
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(assessment.overall_rating || 0)
                                ? 'text-yellow-400'
                                : i < (assessment.overall_rating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                      style={{ width: `${((assessment.overall_rating || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <p>Assessment Date: {formatDate(assessment.assessment_date)}</p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedAssessment(assessment);
                      setShowDetailsModal(true);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Assessment Details Modal */}
          {showDetailsModal && selectedAssessment && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-24 pb-8">
              <div className="w-full max-w-2xl rounded-xl bg-white p-6 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Assessment Details
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {selectedAssessment.employee.name} - {formatDate(selectedAssessment.assessment_date)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAssessment.employee.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAssessment.employee.department.map(dept => dept.name).join(', ')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assessment Date</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedAssessment.assessment_date)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Rating</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <ChatIcon
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(selectedAssessment.overall_rating)
                                  ? 'text-yellow-400'
                                  : i < selectedAssessment.overall_rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedAssessment.overall_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Competency Ratings</h3>
                    <div className="mt-4 space-y-4">
                      {selectedAssessment.competencies.map((competency, index) => (
                        <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {competency.competency.name}
                            </h4>
                            <div className="flex items-center gap-1">
                              <ChatIcon className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {competency.rating}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {competency.comments}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleExportPDF(selectedAssessment!)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Assessment Modal */}
          {showNewAssessmentModal && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-24 pb-8">
              <div className="w-full max-w-2xl rounded-xl bg-white p-6 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    New Assessment
                  </h2>
                  <button
                    onClick={() => setShowNewAssessmentModal(false)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedAssessment) {
                      handleEditAssessment();
                    } else {
                      handleCreateAssessment(e);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Employee Name
                      </label>
                      <input
                        type="text"
                        value={formData.employee_name}
                        onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter employee name"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department
                      </label>
                      <select
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select a department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assessor Name
                    </label>
                    <input
                      type="text"
                      value={formData.assessor_name}
                      onChange={(e) => setFormData({ ...formData, assessor_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter assessor name"
                    />
                  </div>

                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assessment Date
                    </label>
                    <input
                      type="datetime-local"
                      id="date"
                      value={formData.assessment_date}
                      onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'In Progress' | 'Completed' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Overall Rating
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.overall_rating}
                      onChange={(e) => setFormData({ ...formData, overall_rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter overall rating (0-5)"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Competencies</h3>
                    <div className="mt-4 space-y-4">
                      {formData.competencies.map((formCompetency) => (
                        <div key={formCompetency.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              {formCompetency.competency.name}
                            </label>
                            <select
                              value={formCompetency.rating}
                              onChange={(e) => handleCompetencyRatingChange(formCompetency.id, Number(e.target.value))}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                            >
                              <option value="">Select rating</option>
                              <option value="1">Basic - Needs Improvement</option>
                              <option value="2">Intermidiate - Developing</option>
                              <option value="3">Advanced - Proficient</option>
                              <option value="4">Expert - Mastery Demonstrated</option>
                            </select>
                          </div>
                          <textarea
                            placeholder="Add comments..."
                            className="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                            rows={2}
                            value={formCompetency.comments}
                            onChange={(e) => {
                              const updatedCompetencies = formData.competencies.map(comp =>
                                comp.id === formCompetency.id ? { ...comp, comments: e.target.value } : comp
                              );
                              setFormData({ ...formData, competencies: updatedCompetencies });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewAssessmentModal(false);
                        setSelectedAssessment(null);
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : selectedAssessment ? 'Update Assessment' : 'Add Assessment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && assessmentToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Assessment</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to delete this assessment? This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setAssessmentToDelete(null);
                    }}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setAssessmentToDelete(null);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteAssessment(assessmentToDelete.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                  >
                    Delete
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