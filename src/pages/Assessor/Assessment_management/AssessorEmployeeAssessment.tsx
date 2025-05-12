import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Assessment {
  id: string;
  employee_id: string;
  employee_email: string;
  assessment_date: string;
  status: string;
  score: number | null;
}

export default function AssessorEmployeeAssessment() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      // Get all assessments
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id,
          employee_id,
          assessment_date,
          status,
          score,
          users:employee_id (email)
        `)
        .order('assessment_date', { ascending: false });

      if (error) throw error;

      // Format the data
      const formattedData = data.map(item => ({
        id: item.id,
        employee_id: item.employee_id,
        employee_email: Array.isArray(item.users) && item.users.length > 0 ? item.users[0].email : 'Unknown',
        assessment_date: new Date(item.assessment_date).toLocaleDateString(),
        status: item.status,
        score: item.score
      }));

      setAssessments(formattedData);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAssessmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Refresh assessments
      fetchAssessments();
    } catch (error) {
      console.error('Error updating assessment status:', error);
    }
  };

  const updateAssessmentScore = async (id: string, score: number) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ score })
        .eq('id', id);

      if (error) throw error;

      // Refresh assessments
      fetchAssessments();
    } catch (error) {
      console.error('Error updating assessment score:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Employee Assessments</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 border-b dark:border-gray-600 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 border-b dark:border-gray-600 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 border-b dark:border-gray-600 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 border-b dark:border-gray-600 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 border-b dark:border-gray-600 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {assessments.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{assessment.employee_email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{assessment.assessment_date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${assessment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                      assessment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                      'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                    {assessment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {assessment.score !== null ? assessment.score : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <select
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
                      value={assessment.status}
                      onChange={(e) => updateAssessmentStatus(assessment.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm w-16"
                      value={assessment.score || ''}
                      onChange={(e) => updateAssessmentScore(assessment.id, parseInt(e.target.value))}
                      placeholder="Score"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
