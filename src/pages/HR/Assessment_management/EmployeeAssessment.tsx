import { useState, useEffect } from 'react';
import { 
  UserIcon,
  FileIcon,
  ChatIcon
} from "../../../../../../Downloads/hrmoffice/src/icons";
import { supabase } from "../../../../../../Downloads/hrmoffice/src/lib/supabase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Ensure proper import of the plugin


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
  status: 'In Progress' | 'Approved';
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
    status: 'In Progress' | 'Approved';
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
        // First load departments
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('*');

        if (deptError) throw deptError;
        setDepartments(deptData);

        // Load competencies
        const { data: compData, error: compError } = await supabase
          .from('competencies')
          .select('*');

        if (compError) throw compError;
        setCompetencies(compData);

        // Then load assessments
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('employee_assessments')
          .select(`
            *,
            employee_competencies (
              *,
              competency:competencies (*)
            )
          `)
          .order('created_at', { ascending: true });

        if (assessmentError) throw assessmentError;

        const transformedData = assessmentData.map(item => {
          const department = deptData.find(d => d.id === item.department_id);
          return {
            id: item.id,
            employee: {
              name: item.employee_name,
              department: item.department_id ? [{
                id: item.department_id,
                name: department?.name || 'Unknown Department'
              }] : []
            },
            assessor_name: item.assessor_name,
            assessment_date: item.assessment_date,
            status: item.status,
            overall_rating: item.overall_rating,
            isEdited: item.is_edited,
            competencies: item.employee_competencies.map((comp: { id: string; rating: number; comments: string; competency: { id: string; name: string } }) => ({
              id: comp.id,
              rating: comp.rating,
              comments: comp.comments,
              competency: comp.competency
            }))
          };
        });

        setAssessments(transformedData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
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
      
      const { data, error } = await supabase
        .from('employee_assessments')
        .select(`
          *,
          employee_competencies (
            *,
            competency:competencies (*)
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedData = data.map(item => {
        const department = departments.find(d => d.id === item.department_id);
        return {
          id: item.id,
          employee: {
            name: item.employee_name,
            department: item.department_id ? [{
              id: item.department_id,
              name: department?.name || 'Unknown Department'
            }] : []
          },
          assessor_name: item.assessor_name,
          assessment_date: item.assessment_date,
          status: item.status,
          overall_rating: item.overall_rating,
          isEdited: item.is_edited,
          competencies: item.employee_competencies.map((comp: { id: string; rating: number; comments: string; competency: { id: string; name: string } }) => ({
            id: comp.id,
            rating: comp.rating,
            comments: comp.comments,
            competency: comp.competency
          }))
        };
      });

      setAssessments(transformedData);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load assessments');
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

      // Start a transaction
      const { data: assessment, error: assessmentError } = await supabase
        .from('employee_assessments')
        .insert({
          employee_name: formData.employee_name,
          assessor_name: formData.assessor_name,
          assessment_date: formData.assessment_date,
          status: 'In Progress',
          overall_rating: Number(formData.overall_rating) || 0,
          is_edited: false,
          department_id: formData.department_id
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Insert competencies
      const competencyInserts = formData.competencies.map(comp => ({
        assessment_id: assessment.id,
        competency_id: comp.id,
        rating: comp.rating,
        comments: comp.comments
      }));

      const { error: competencyError } = await supabase
        .from('employee_competencies')
        .insert(competencyInserts);

      if (competencyError) throw competencyError;

      // Add the new assessment to the end of the list
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
        status: 'In Progress' as const,
        overall_rating: Number(formData.overall_rating) || 0,
        isEdited: false,
        competencies: competencyInserts.map(comp => ({
          id: comp.competency_id,
          rating: comp.rating,
          comments: comp.comments,
          competency: competencies.find(c => c.id === comp.competency_id) || { id: '', name: 'Unknown Competency' }
        }))
      };

      setAssessments(prevAssessments => [...prevAssessments, newAssessment]);
      setShowNewAssessmentModal(false);
      setFormData({
        employee_name: '',
        assessor_name: '',
        assessment_date: new Date().toISOString().slice(0, 16),
        status: 'In Progress',
        overall_rating: 0,
        department_id: '',
        competencies: []
      });
    } catch (err) {
      console.error('Error creating assessment:', err);
      setError('Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAssessmentClick = () => {
    setSelectedAssessment(null);
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16); // This will give us YYYY-MM-DDTHH:mm
    setFormData({
      employee_name: '',
      assessor_name: '',
      assessment_date: formattedDate,
      status: 'In Progress',
      overall_rating: 0,
      department_id: '',
      competencies: competencies.map(comp => ({
        id: comp.id,
        rating: 0,
        comments: '',
        competency: comp
      }))
    });
    setShowNewAssessmentModal(true);
  };

  const handleEditClick = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    const mappedCompetencies = assessment.competencies.map(comp => ({
      id: comp.competency.id,
      rating: comp.rating,
      comments: comp.comments || '',
      competency: comp.competency
    }));

    // Add any missing competencies
    const allCompetencies = competencies.map(comp => {
      const existingComp = mappedCompetencies.find(c => c.id === comp.id);
      return existingComp || {
        id: comp.id,
        rating: 0,
        comments: '',
        competency: comp
      };
    });

    setFormData({
      employee_name: assessment.employee.name,
      assessor_name: assessment.assessor_name,
      assessment_date: assessment.assessment_date,
      status: assessment.status,
      overall_rating: assessment.overall_rating,
      department_id: assessment.employee.department[0]?.id || '',
      competencies: allCompetencies
    });
    setShowNewAssessmentModal(true);
  };

  const handleEditAssessment = async () => {
    if (!selectedAssessment) return;

    try {
      setLoading(true);
      setError(null);

      // Update the existing assessment
      const { error: updateError } = await supabase
        .from('employee_assessments')
        .update({
          employee_name: formData.employee_name,
          assessor_name: formData.assessor_name,
          assessment_date: formData.assessment_date,
          status: formData.status,
          overall_rating: Number(formData.overall_rating) || 0,
          department_id: formData.department_id
        })
        .eq('id', selectedAssessment.id);

      if (updateError) throw updateError;

      // Update competencies
      const competencyUpdates = formData.competencies.map(comp => ({
        assessment_id: selectedAssessment.id,
        competency_id: comp.id,
        rating: comp.rating,
        comments: comp.comments
      }));

      // Delete existing competencies
      const { error: deleteError } = await supabase
        .from('employee_competencies')
        .delete()
        .eq('assessment_id', selectedAssessment.id);

      if (deleteError) throw deleteError;

      // Insert updated competencies
      const { error: insertError } = await supabase
        .from('employee_competencies')
        .insert(competencyUpdates);

      if (insertError) throw insertError;

      // Fetch the updated assessment with all its data
      const { data: updatedAssessment, error: fetchError } = await supabase
        .from('employee_assessments')
        .select(`
          *,
          employee_competencies (
            *,
            competency:competencies (*)
          )
        `)
        .eq('id', selectedAssessment.id)
        .single();

      if (fetchError) throw fetchError;

      // Transform the updated assessment data
      const department = departments.find(d => d.id === updatedAssessment.department_id);
      const transformedAssessment = {
        id: updatedAssessment.id,
        employee: {
          name: updatedAssessment.employee_name,
          department: updatedAssessment.department_id ? [{
            id: updatedAssessment.department_id,
            name: department?.name || 'Unknown Department'
          }] : []
        },
        assessor_name: updatedAssessment.assessor_name,
        assessment_date: updatedAssessment.assessment_date,
        status: updatedAssessment.status,
        overall_rating: updatedAssessment.overall_rating,
        isEdited: updatedAssessment.is_edited,
        competencies: updatedAssessment.employee_competencies.map((comp: { id: string; rating: number; comments: string; competency: { id: string; name: string } }) => ({
          id: comp.id,
          rating: comp.rating,
          comments: comp.comments,
          competency: comp.competency
        }))
      };

      // Update the state with the transformed assessment
      setAssessments(prevAssessments => 
        prevAssessments.map(assessment => 
          assessment.id === selectedAssessment.id ? transformedAssessment : assessment
        )
      );

      setShowNewAssessmentModal(false);
      setSelectedAssessment(null);
    } catch (err) {
      console.error('Error updating assessment:', err);
      setError('Failed to update assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('employee_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchAssessments();
      setShowDeleteModal(false);
      setAssessmentToDelete(null);
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setError('Failed to delete assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = (assessment: Assessment) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text('Employee Assessment Report', 14, 15);

    // Add assessment details
    doc.setFontSize(12);
    doc.text(`Employee: ${assessment.employee.name}`, 14, 30);
    doc.text(`Department: ${assessment.employee.department[0]?.name || 'N/A'}`, 14, 40);
    doc.text(`Assessor: ${assessment.assessor_name}`, 14, 50);
    doc.text(`Date: ${formatDate(assessment.assessment_date)}`, 14, 60);
    doc.text(`Overall Rating: ${assessment.overall_rating}`, 14, 70);

    // Add competencies table
    const tableData = assessment.competencies.map(comp => [
        comp.competency.name,
        comp.rating.toString(),
        comp.comments || 'N/A'
    ]);

    autoTable(doc, {
        startY: 80,
        head: [['Competency', 'Rating', 'Comments']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
    });

    // Save the PDF
    doc.save(`Assessment_${assessment.employee.name}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.employee.department.some(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: '✓' };
      case 'In Progress':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: '⏳' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', icon: '•' };
    }
  };

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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Employee Competency Assessment</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">Manage and track employee competency assessments</p>
            </div>
            <button 
              onClick={handleNewAssessmentClick}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              New Assessment
            </button>
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
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assessment.employee.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {assessment.employee.department.map(dept => dept.name).join(', ')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(assessment.status).bg} ${getStatusColor(assessment.status).text} whitespace-nowrap`}>
                    <span>{getStatusColor(assessment.status).icon}</span>
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
                  <p>Assessor: {assessment.assessor_name}</p>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedAssessment(assessment);
                      setShowDetailsModal(true);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditClick(assessment)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => {
                      setAssessmentToDelete(assessment);
                      setShowDeleteModal(true);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-red-400 dark:hover:bg-white/[0.05]"
                  >
                    Delete
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
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assessor</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAssessment.assessor_name}</p>
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
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'In Progress' | 'Approved' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Approved">Approved</option>
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