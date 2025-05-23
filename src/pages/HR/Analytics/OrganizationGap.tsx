import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ChartPieIcon,
  CalendarIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Types
interface Competency {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  employee_count: number;
}

interface JobRole {
  id: string;
  name: string;
  employee_count: number;
}

interface CompetencyRating {
  id: string;
  competency_id: string;
  rating: number;
  comments: string;
  assessor_comments?: string;
  assessor_rating?: number;
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
  consensus_rating?: number;
  consensus_comments?: string;
  consensus_status?: string;
}

// Define chart options type
type ChartOptions = {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      position: 'top';
      labels: {
        color: string;
        font: {
          size: number;
          weight: 'bold';
        }
      }
    };
    title: {
      display: boolean;
      text: string;
      color: string;
      font: {
        size: number;
        weight: 'bold';
      }
    };
    tooltip?: {
      callbacks: {
        label: (context: any) => string;
      };
      backgroundColor: string;
      titleColor: string;
      bodyColor: string;
      padding: number;
      cornerRadius: number;
    };
  };
  scales?: {
    y: {
      beginAtZero: boolean;
      max: number;
      title: {
        display: boolean;
        text: string;
        color: string;
        font: {
          weight: 'bold';
        }
      };
      ticks: {
        color: string;
        font: {
          weight: 'bold';
        }
      };
      grid: {
        color: string;
      };
    };
    x: {
      ticks: {
        color: string;
        font: {
          weight: 'bold';
        }
      };
      grid: {
        color: string;
      };
    };
  };
};

// Helper functions

function OrganizationGap() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<EmployeeAssessment[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  // We're using all departments and job roles by default
  const [timeRange, setTimeRange] = useState<string>('all');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [viewMode, setViewMode] = useState<'department' | 'job' | 'organization'>('organization');

  // Load data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Get all reviewed employee assessments
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('employee_assessments')
          .select('*')
          .eq('assessor_status', 'reviewed')
          .order('last_updated', { ascending: false });

        if (!isMounted) return;
        if (assessmentError) throw assessmentError;

        if (assessmentData && assessmentData.length > 0) {
          // Process the data to ensure all required fields are present
          const processedData = assessmentData.map(assessment => ({
            ...assessment,
            competency_ratings: assessment.competency_ratings.map((rating: any) => ({
              ...rating,
              assessor_comments: rating.assessor_comments || '',
              assessor_rating: rating.assessor_rating || 0
            }))
          }));

          if (isMounted) setAssessments(processedData);
        }

        // Get departments with employee counts
        const { data: departmentData, error: departmentError } = await supabase
          .from('departments')
          .select('id, name');

        if (!isMounted) return;
        if (departmentError) throw departmentError;

        if (departmentData) {
          const departmentsWithCounts = departmentData.map(dept => {
            const count = assessmentData ? assessmentData.filter(a => a.department_id === dept.id).length : 0;
            return {
              ...dept,
              employee_count: count
            };
          });

          if (isMounted) setDepartments(departmentsWithCounts);
        }

        // Get job roles with employee counts
        const { data: jobRoleData, error: jobRoleError } = await supabase
          .from('job_roles')
          .select('id, name');

        if (!isMounted) return;
        if (jobRoleError) throw jobRoleError;

        if (jobRoleData) {
          // Add employee count to each job role
          const jobRolesWithCounts = jobRoleData.map(role => {
            const count = assessmentData ? assessmentData.filter(a => a.job_role_id === role.id).length : 0;
            return {
              ...role,
              employee_count: count
            };
          });

          if (isMounted) setJobRoles(jobRolesWithCounts);
        }

        // Set standard competencies
        if (isMounted) {
          setCompetencies([
            { id: '1', name: 'Communication' },
            { id: '2', name: 'Problem Solving' },
            { id: '3', name: 'Leadership' },
            { id: '4', name: 'Technical Skills' },
            { id: '5', name: 'Teamwork' }
          ]);
        }

      } catch (err) {
        console.error('Error loading data:', err);
        if (isMounted) {
          setError('Failed to load organization data. Please refresh the page or contact support.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Filter assessments based on selected time range
  const filteredAssessments = assessments.filter(assessment => {
    // Filter by time range
    if (timeRange !== 'all') {
      const assessmentDate = new Date(assessment.last_updated);
      const now = new Date();

      switch (timeRange) {
        case '30days':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (assessmentDate < thirtyDaysAgo) return false;
          break;
        case '90days':
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(now.getDate() - 90);
          if (assessmentDate < ninetyDaysAgo) return false;
          break;
        case '1year':
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          if (assessmentDate < oneYearAgo) return false;
          break;
      }
    }

    return true;
  });

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Gap Analysis</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Analyze competency gaps across departments, job roles, and the entire organization
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                <DocumentChartBarIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No Assessment Data Available</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-lg">
                There are no reviewed employee assessments in the system yet. Once assessors review employee assessments, you'll be able to see organization-wide gap analysis here.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Filters and Controls */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Time Range Filter */}
                  <div className="w-full sm:w-auto">
                    <label htmlFor="time-range-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Range
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="time-range-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                      >
                        <option value="all">All Time</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                        <option value="1year">Last Year</option>
                      </select>
                    </div>
                  </div>

                  {/* View Mode Selector */}
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('organization')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        viewMode === 'organization'
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Rating Comparison
                    </button>
                    <button
                      onClick={() => setViewMode('department')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        viewMode === 'department'
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Departments
                    </button>
                    <button
                      onClick={() => setViewMode('job')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        viewMode === 'job'
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Job Roles
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Chart Type Selector */}
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`p-1.5 rounded-md ${
                        chartType === 'bar'
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      title="Bar Chart"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setChartType('pie')}
                      className={`p-1.5 rounded-md ${
                        chartType === 'pie'
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      title="Pie Chart"
                    >
                      <ChartPieIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md"
                    title="Refresh Data"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Organization Summary */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {viewMode === 'organization' ? 'Rating Comparison Summary' :
                 viewMode === 'department' ? 'Department Summary' : 'Job Role Summary'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Assessments</h3>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {filteredAssessments.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total reviewed assessments
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Average Self Rating</h3>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredAssessments.length > 0 ?
                      (filteredAssessments.reduce((sum, assessment) => {
                        const ratings = assessment.competency_ratings.map(r => r.rating);
                        return sum + (ratings.reduce((s, r) => s + r, 0) / ratings.length);
                      }, 0) / filteredAssessments.length).toFixed(1) : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Across all competencies
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Average Assessor Rating</h3>
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {filteredAssessments.length > 0 ?
                      (filteredAssessments.reduce((sum, assessment) => {
                        const ratings = assessment.competency_ratings
                          .map(r => r.assessor_rating || 0)
                          .filter(r => r > 0);
                        return sum + (ratings.length > 0 ?
                          (ratings.reduce((s, r) => s + r, 0) / ratings.length) : 0);
                      }, 0) / filteredAssessments.length).toFixed(1) : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Across all competencies
                  </p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <div className="h-80">
                {viewMode === 'organization' ? (
                  <OrganizationCharts
                    assessments={filteredAssessments}
                    competencies={competencies}
                    chartType={chartType}
                  />
                ) : viewMode === 'department' ? (
                  <DepartmentCharts
                    assessments={filteredAssessments}
                    departments={departments}
                    competencies={competencies}
                    chartType={chartType}
                  />
                ) : (
                  <JobRoleCharts
                    assessments={filteredAssessments}
                    jobRoles={jobRoles}
                    competencies={competencies}
                    chartType={chartType}
                  />
                )}
              </div>
            </div>

            {/* Data Tables */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Analysis</h2>
              </div>
              <div className="overflow-x-auto">
                {viewMode === 'organization' ? (
                  <OrganizationTable
                    assessments={filteredAssessments}
                    competencies={competencies}
                  />
                ) : viewMode === 'department' ? (
                  <DepartmentTable
                    assessments={filteredAssessments}
                    departments={departments}
                    competencies={competencies}
                  />
                ) : (
                  <JobRoleTable
                    assessments={filteredAssessments}
                    jobRoles={jobRoles}
                    competencies={competencies}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Organization Charts Component
interface OrganizationChartsProps {
  assessments: EmployeeAssessment[];
  competencies: Competency[];
  chartType: 'bar' | 'pie';
}

// Organization Table Component
interface OrganizationTableProps {
  assessments: EmployeeAssessment[];
  competencies: Competency[];
}

const OrganizationTable: React.FC<OrganizationTableProps> = ({ assessments, competencies }) => {
  // Calculate organization-wide competency data
  const getCompetencyData = () => {
    if (assessments.length === 0) return [];

    // Get all competency IDs
    const competencyIds = competencies.map(c => c.id);

    // Calculate average self and assessor ratings for each competency
    const result = competencyIds.map(id => {
      const competency = competencies.find(c => c.id === id);
      const name = competency ? competency.name : `Competency ${id}`;

      // Collect all ratings for this competency
      const selfRatings: number[] = [];
      const assessorRatings: number[] = [];

      assessments.forEach(assessment => {
        assessment.competency_ratings.forEach(rating => {
          if (rating.competency_id === id) {
            selfRatings.push(rating.rating);
            if (rating.assessor_rating) {
              assessorRatings.push(rating.assessor_rating);
            }
          }
        });
      });

      // Calculate averages
      const avgSelfRating = selfRatings.length > 0 ?
        selfRatings.reduce((sum, r) => sum + r, 0) / selfRatings.length : 0;

      const avgAssessorRating = assessorRatings.length > 0 ?
        assessorRatings.reduce((sum, r) => sum + r, 0) / assessorRatings.length : 0;

      // Calculate gap
      const gap = avgAssessorRating - avgSelfRating;

      return {
        id,
        name,
        avgSelfRating: avgSelfRating.toFixed(1),
        avgAssessorRating: avgAssessorRating.toFixed(1),
        gap: gap.toFixed(1),
        absoluteGap: Math.abs(gap).toFixed(1),
        assessmentCount: selfRatings.length
      };
    });

    // Sort by absolute gap size (largest first)
    return result.sort((a, b) => parseFloat(b.absoluteGap) - parseFloat(a.absoluteGap));
  };

  const competencyData = getCompetencyData();

  if (competencyData.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No data available for analysis</p>
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Competency
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Avg. Self Rating
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Avg. Assessor Rating
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Gap
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Assessments
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
        {competencyData.map(item => (
          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 dark:text-blue-400">
              {item.avgSelfRating}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-pink-600 dark:text-pink-400">
              {item.avgAssessorRating}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                parseFloat(item.gap) > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : parseFloat(item.gap) < 0
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {parseFloat(item.gap) > 0 ? '+' : ''}{item.gap}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
              {item.assessmentCount}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Department Table Component
interface DepartmentTableProps {
  assessments: EmployeeAssessment[];
  departments: Department[];
  competencies: Competency[];
}

const DepartmentTable: React.FC<DepartmentTableProps> = ({ assessments, departments }) => {
  // Calculate department-level data
  const getDepartmentData = () => {
    if (assessments.length === 0 || departments.length === 0) return [];

    // Only include departments that have assessments
    const departmentsWithData = departments.filter(dept =>
      assessments.some(a => a.department_id === dept.id)
    );

    if (departmentsWithData.length === 0) return [];

    const result = departmentsWithData.map(dept => {
      // Get all assessments for this department
      const deptAssessments = assessments.filter(a => a.department_id === dept.id);

      // Collect all ratings
      const selfRatings = deptAssessments.flatMap(a =>
        a.competency_ratings.map(r => r.rating)
      );

      const assessorRatings = deptAssessments.flatMap(a =>
        a.competency_ratings
          .map(r => r.assessor_rating || 0)
          .filter(r => r > 0)
      );

      // Calculate averages
      const avgSelfRating = selfRatings.length > 0 ?
        selfRatings.reduce((sum, r) => sum + r, 0) / selfRatings.length : 0;

      const avgAssessorRating = assessorRatings.length > 0 ?
        assessorRatings.reduce((sum, r) => sum + r, 0) / assessorRatings.length : 0;

      // Calculate gap
      const gap = avgAssessorRating - avgSelfRating;

      return {
        id: dept.id,
        name: dept.name,
        avgSelfRating: avgSelfRating.toFixed(1),
        avgAssessorRating: avgAssessorRating.toFixed(1),
        gap: gap.toFixed(1),
        absoluteGap: Math.abs(gap).toFixed(1),
        assessmentCount: deptAssessments.length,
        employeeCount: dept.employee_count
      };
    });

    // Sort by absolute gap size (largest first)
    return result.sort((a, b) => parseFloat(b.absoluteGap) - parseFloat(a.absoluteGap));
  };

  const departmentData = getDepartmentData();

  if (departmentData.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No department data available for analysis</p>
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Department
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Avg. Self Rating
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Avg. Assessor Rating
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Gap
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Assessments
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Employees
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
        {departmentData.map(item => (
          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 dark:text-blue-400">
              {item.avgSelfRating}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-pink-600 dark:text-pink-400">
              {item.avgAssessorRating}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                parseFloat(item.gap) > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : parseFloat(item.gap) < 0
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {parseFloat(item.gap) > 0 ? '+' : ''}{item.gap}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
              {item.assessmentCount}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
              {item.employeeCount}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Job Role Table Component
interface JobRoleTableProps {
  assessments: EmployeeAssessment[];
  jobRoles: JobRole[];
  competencies: Competency[];
}

const JobRoleTable: React.FC<JobRoleTableProps> = ({ assessments, jobRoles }) => {
  // Calculate job role-level data
  const getJobRoleData = () => {
    if (assessments.length === 0 || jobRoles.length === 0) return [];

    // Only include job roles that have assessments
    const rolesWithData = jobRoles.filter(role =>
      assessments.some(a => a.job_role_id === role.id)
    );

    if (rolesWithData.length === 0) return [];

    const result = rolesWithData.map(role => {
      // Get all assessments for this job role
      const roleAssessments = assessments.filter(a => a.job_role_id === role.id);

      // Collect all ratings
      const selfRatings = roleAssessments.flatMap(a =>
        a.competency_ratings.map(r => r.rating)
      );

      const assessorRatings = roleAssessments.flatMap(a =>
        a.competency_ratings
          .map(r => r.assessor_rating || 0)
          .filter(r => r > 0)
      );

      // Calculate averages
      const avgSelfRating = selfRatings.length > 0 ?
        selfRatings.reduce((sum, r) => sum + r, 0) / selfRatings.length : 0;

      const avgAssessorRating = assessorRatings.length > 0 ?
        assessorRatings.reduce((sum, r) => sum + r, 0) / assessorRatings.length : 0;

      // Calculate gap
      const gap = avgAssessorRating - avgSelfRating;

      return {
        id: role.id,
        name: role.name,
        avgSelfRating: avgSelfRating.toFixed(1),
        avgAssessorRating: avgAssessorRating.toFixed(1),
        gap: gap.toFixed(1),
        absoluteGap: Math.abs(gap).toFixed(1),
        assessmentCount: roleAssessments.length,
        employeeCount: role.employee_count
      };
    });

    // Sort by absolute gap size (largest first)
    return result.sort((a, b) => parseFloat(b.absoluteGap) - parseFloat(a.absoluteGap));
  };

  const jobRoleData = getJobRoleData();

  if (jobRoleData.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No job role data available for analysis</p>
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Job Role
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Avg. Self Rating
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Avg. Assessor Rating
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Gap
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Assessments
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Employees
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
        {jobRoleData.map(item => (
          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {item.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 dark:text-blue-400">
              {item.avgSelfRating}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-pink-600 dark:text-pink-400">
              {item.avgAssessorRating}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                parseFloat(item.gap) > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : parseFloat(item.gap) < 0
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {parseFloat(item.gap) > 0 ? '+' : ''}{item.gap}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
              {item.assessmentCount}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
              {item.employeeCount}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const OrganizationCharts: React.FC<OrganizationChartsProps> = ({ assessments, competencies, chartType }) => {
  // Chart options with default values

  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#000000', // Default to black
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Organization-wide Competency Gap Analysis',
        color: '#000000', // Default to black
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw.toFixed(1);
            return `${label}: ${value}`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (1-5)',
          color: '#000000', // Default to black
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          color: '#000000', // Default to black
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.2)' // Neutral gray that works in both modes
        }
      },
      x: {
        ticks: {
          color: '#000000', // Default to black
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.2)' // Neutral gray that works in both modes
        }
      }
    } : undefined
  });

  // Update chart options based on dark mode
  useEffect(() => {
    // Function to check if dark mode is active
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');

      // Update chart options based on dark mode
      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                size: 12,
                weight: 'bold' as const
              }
            }
          },
          title: {
            display: true,
            text: 'Competency Rating Comparison Analysis',
            color: isDarkMode ? '#FFFFFF' : '#000000',
            font: {
              size: 16,
              weight: 'bold' as const
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.dataset.label || '';
                const value = context.raw.toFixed(1);
                return `${label}: ${value}`;
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 10,
            cornerRadius: 6
          }
        },
        scales: chartType === 'bar' ? {
          y: {
            beginAtZero: true,
            max: 5,
            title: {
              display: true,
              text: 'Average Rating (1-5)',
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold' as const
              }
            },
            ticks: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold' as const
              }
            },
            grid: {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            ticks: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold' as const
              }
            },
            grid: {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          }
        } : undefined
      });
    };

    // Check dark mode on mount
    checkDarkMode();

    // Set up a mutation observer to detect theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Clean up observer on unmount
    return () => observer.disconnect();
  }, [chartType]);

  // Calculate data for charts
  const getChartData = () => {
    if (assessments.length === 0) return null;

    // Get all competency IDs
    const competencyIds = competencies.map(c => c.id);

    // Calculate average self and assessor ratings for each competency
    const selfRatings: Record<string, number[]> = {};
    const assessorRatings: Record<string, number[]> = {};

    // Initialize arrays for each competency
    competencyIds.forEach(id => {
      selfRatings[id] = [];
      assessorRatings[id] = [];
    });

    // Collect all ratings
    assessments.forEach(assessment => {
      assessment.competency_ratings.forEach(rating => {
        if (competencyIds.includes(rating.competency_id)) {
          selfRatings[rating.competency_id].push(rating.rating);
          if (rating.assessor_rating) {
            assessorRatings[rating.competency_id].push(rating.assessor_rating);
          }
        }
      });
    });

    // Calculate averages
    const avgSelfRatings = competencyIds.map(id => {
      const ratings = selfRatings[id];
      return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    });

    const avgAssessorRatings = competencyIds.map(id => {
      const ratings = assessorRatings[id];
      return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    });

    // Calculate gaps
    const gaps = competencyIds.map((_id, index) => {
      return avgAssessorRatings[index] - avgSelfRatings[index];
    });

    // Get competency names for labels
    const labels = competencyIds.map(id => {
      const competency = competencies.find(c => c.id === id);
      return competency ? competency.name : `Competency ${id}`;
    });

    if (chartType === 'bar') {
      return {
        labels,
        datasets: [
          {
            label: 'Self Rating',
            data: avgSelfRatings,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Assessor Rating',
            data: avgAssessorRatings,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: 'Gap',
            data: gaps,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      };
    } else {
      // Calculate overall averages for pie chart
      const avgSelfRating = avgSelfRatings.reduce((sum, r) => sum + r, 0) / avgSelfRatings.length;
      const avgAssessorRating = avgAssessorRatings.reduce((sum, r) => sum + r, 0) / avgAssessorRatings.length;
      const overallGap = Math.abs(avgAssessorRating - avgSelfRating);

      // Calculate agreement percentage (inverse of gap)
      const maxPossibleGap = 4; // Maximum possible gap is 4 (between 1 and 5)
      const agreementPercentage = 100 - (overallGap / maxPossibleGap * 100);

      return {
        labels: ['Agreement', 'Gap'],
        datasets: [
          {
            data: [agreementPercentage, 100 - agreementPercentage],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)',
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
    }
  };

  const chartData = getChartData();

  if (!chartData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No data available for charts</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
      {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
    </div>
  );
};

// Department Charts Component
interface DepartmentChartsProps {
  assessments: EmployeeAssessment[];
  departments: Department[];
  competencies: Competency[];
  chartType: 'bar' | 'pie';
}

const DepartmentCharts: React.FC<DepartmentChartsProps> = ({ assessments, departments, chartType }) => {
  // Similar implementation to OrganizationCharts but grouped by department
  // For brevity, we'll implement a simplified version

  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#000000',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Department Competency Gap Analysis',
        color: '#000000',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (1-5)',
          color: '#000000',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          color: '#000000',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.2)'
        }
      },
      x: {
        ticks: {
          color: '#000000',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.2)'
        }
      }
    } : undefined
  });

  // Update chart options for dark mode (similar to OrganizationCharts)
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          },
          title: {
            display: true,
            text: 'Department Competency Gap Analysis',
            color: isDarkMode ? '#FFFFFF' : '#000000',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: chartType === 'bar' ? {
          y: {
            beginAtZero: true,
            max: 5,
            title: {
              display: true,
              text: 'Average Rating (1-5)',
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            ticks: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          }
        } : undefined
      });
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [chartType]);

  // Get chart data grouped by department
  const getChartData = () => {
    if (assessments.length === 0 || departments.length === 0) return null;

    // Only include departments that have assessments
    const departmentsWithData = departments.filter(dept =>
      assessments.some(a => a.department_id === dept.id)
    );

    if (departmentsWithData.length === 0) return null;

    const labels = departmentsWithData.map(dept => dept.name);

    // Calculate average self and assessor ratings for each department
    const selfRatings = departmentsWithData.map(dept => {
      const deptAssessments = assessments.filter(a => a.department_id === dept.id);
      if (deptAssessments.length === 0) return 0;

      const allRatings = deptAssessments.flatMap(a =>
        a.competency_ratings.map(r => r.rating)
      );

      return allRatings.length > 0 ?
        allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length : 0;
    });

    const assessorRatings = departmentsWithData.map(dept => {
      const deptAssessments = assessments.filter(a => a.department_id === dept.id);
      if (deptAssessments.length === 0) return 0;

      const allRatings = deptAssessments.flatMap(a =>
        a.competency_ratings
          .map(r => r.assessor_rating || 0)
          .filter(r => r > 0)
      );

      return allRatings.length > 0 ?
        allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length : 0;
    });

    // Calculate gaps
    const gaps = selfRatings.map((rating, index) =>
      assessorRatings[index] - rating
    );

    if (chartType === 'bar') {
      return {
        labels,
        datasets: [
          {
            label: 'Self Rating',
            data: selfRatings,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Assessor Rating',
            data: assessorRatings,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: 'Gap',
            data: gaps,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      };
    } else {
      // For pie chart, show departments with largest gaps
      const departmentGaps = departmentsWithData.map((dept, index) => ({
        name: dept.name,
        gap: Math.abs(gaps[index])
      }));

      // Sort by gap size and take top 5
      const topDepartments = departmentGaps
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 5);

      return {
        labels: topDepartments.map(d => d.name),
        datasets: [
          {
            data: topDepartments.map(d => d.gap),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
    }
  };

  const chartData = getChartData();

  if (!chartData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No department data available for charts</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
      {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
    </div>
  );
};

// Job Role Charts Component
interface JobRoleChartsProps {
  assessments: EmployeeAssessment[];
  jobRoles: JobRole[];
  competencies: Competency[];
  chartType: 'bar' | 'pie';
}

const JobRoleCharts: React.FC<JobRoleChartsProps> = ({ assessments, jobRoles, chartType }) => {
  // Similar implementation to DepartmentCharts but grouped by job role
  // For brevity, we'll implement a simplified version

  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#000000',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Job Role Competency Gap Analysis',
        color: '#000000',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Rating (1-5)',
          color: '#000000',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          color: '#000000',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.2)'
        }
      },
      x: {
        ticks: {
          color: '#000000',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(128, 128, 128, 0.2)'
        }
      }
    } : undefined
  });

  // Update chart options for dark mode (similar to previous components)
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          },
          title: {
            display: true,
            text: 'Job Role Competency Gap Analysis',
            color: isDarkMode ? '#FFFFFF' : '#000000',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: chartType === 'bar' ? {
          y: {
            beginAtZero: true,
            max: 5,
            title: {
              display: true,
              text: 'Average Rating (1-5)',
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold'
              }
            },
            ticks: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            ticks: {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          }
        } : undefined
      });
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [chartType]);

  // Get chart data grouped by job role
  const getChartData = () => {
    if (assessments.length === 0 || jobRoles.length === 0) return null;

    // Only include job roles that have assessments
    const rolesWithData = jobRoles.filter(role =>
      assessments.some(a => a.job_role_id === role.id)
    );

    if (rolesWithData.length === 0) return null;

    const labels = rolesWithData.map(role => role.name);

    // Calculate average self and assessor ratings for each job role
    const selfRatings = rolesWithData.map(role => {
      const roleAssessments = assessments.filter(a => a.job_role_id === role.id);
      if (roleAssessments.length === 0) return 0;

      const allRatings = roleAssessments.flatMap(a =>
        a.competency_ratings.map(r => r.rating)
      );

      return allRatings.length > 0 ?
        allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length : 0;
    });

    const assessorRatings = rolesWithData.map(role => {
      const roleAssessments = assessments.filter(a => a.job_role_id === role.id);
      if (roleAssessments.length === 0) return 0;

      const allRatings = roleAssessments.flatMap(a =>
        a.competency_ratings
          .map(r => r.assessor_rating || 0)
          .filter(r => r > 0)
      );

      return allRatings.length > 0 ?
        allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length : 0;
    });

    // Calculate gaps
    const gaps = selfRatings.map((rating, index) =>
      assessorRatings[index] - rating
    );

    if (chartType === 'bar') {
      return {
        labels,
        datasets: [
          {
            label: 'Self Rating',
            data: selfRatings,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Assessor Rating',
            data: assessorRatings,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: 'Gap',
            data: gaps,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      };
    } else {
      // For pie chart, show job roles with largest gaps
      const roleGaps = rolesWithData.map((role, index) => ({
        name: role.name,
        gap: Math.abs(gaps[index])
      }));

      // Sort by gap size and take top 5
      const topRoles = roleGaps
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 5);

      return {
        labels: topRoles.map(r => r.name),
        datasets: [
          {
            data: topRoles.map(r => r.gap),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
    }
  };

  const chartData = getChartData();

  if (!chartData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No job role data available for charts</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
      {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
    </div>
  );
};

export default OrganizationGap;