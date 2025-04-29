import { useState } from 'react';
import { 
  PencilIcon, 
  TrashBinIcon,
  UserIcon,
  FileIcon,
  ChatIcon,
  BoxIcon
} from "../../icons";

interface AssessorAssessment {
  id: number;
  employee: {
    id: number;
    name: string;
    position: string;
    department: string;
  };
  assessor: {
    id: number;
    name: string;
    role: string;
  };
  date: string;
  status: 'Draft' | 'Submitted' | 'Reviewed';
  overall_rating: number;
  competencies: {
    name: string;
    rating: number;
    comments: string;
  }[];
}

const mockAssessments: AssessorAssessment[] = [
  {
    id: 1,
    employee: {
      id: 101,
      name: "John David",
      position: "Senior Developer",
      department: "Engineering"
    },
    assessor: {
      id: 201,
      name: "Sarah Smith",
      role: "Team Lead"
    },
    date: "2024-03-15",
    status: "Draft",
    overall_rating: 4.5,
    competencies: [
      {
        name: "Technical Skills",
        rating: 5,
        comments: "Excellent technical knowledge and problem-solving abilities."
      },
      {
        name: "Communication",
        rating: 4,
        comments: "Good communication skills, could improve in technical documentation."
      },
      {
        name: "Teamwork",
        rating: 4.5,
        comments: "Works well in team settings and contributes effectively."
      }
    ]
  }
];

export default function AssessorAssessment() {
  const [assessments] = useState<AssessorAssessment[]>(mockAssessments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<AssessorAssessment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewAssessmentModal, setShowNewAssessmentModal] = useState(false);

  const filteredAssessments = assessments.filter(assessment =>
    assessment.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Assessor Assessment</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage and track individual assessor evaluations</p>
        </div>
        <button 
          onClick={() => setShowNewAssessmentModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          New Assessment
        </button>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="block w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-400"
            placeholder="Search by employee name, position, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssessments.map((assessment) => (
          <div 
            key={assessment.id}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {assessment.employee.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {assessment.employee.position}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {assessment.employee.department}
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(assessment.status)}`}>
                {assessment.status}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Rating</span>
                <div className="flex items-center gap-1">
                  <ChatIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {assessment.overall_rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                  style={{ width: `${(assessment.overall_rating / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Assessor: {assessment.assessor.name} ({assessment.assessor.role})
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(assessment.date).toLocaleDateString()}
                </span>
              </div>
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
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]">
                <PencilIcon className="h-4 w-4" />
              </button>
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-red-400 dark:hover:bg-white/[0.05]">
                <TrashBinIcon className="h-4 w-4" />
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
                  {selectedAssessment.employee.name} - {selectedAssessment.date}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <BoxIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAssessment.employee.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAssessment.employee.position}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAssessment.employee.department}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assessor</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedAssessment.assessor.name} ({selectedAssessment.assessor.role})
                  </p>
                </div>
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

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Competency Ratings</h3>
                <div className="mt-4 space-y-4">
                  {selectedAssessment.competencies.map((competency, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {competency.name}
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
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
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
                <BoxIcon className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="employee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employee
                  </label>
                  <select
                    id="employee"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Select an employee</option>
                    <option value="1">John Doe</option>
                    <option value="2">Jane Smith</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assessment Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Competencies</h3>
                <div className="mt-4 space-y-4">
                  {['Technical Skills', 'Communication', 'Teamwork', 'Leadership'].map((competency) => (
                    <div key={competency} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          {competency}
                        </label>
                        <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                          <option value="">Select rating</option>
                          <option value="1">1 - Needs Improvement</option>
                          <option value="2">2 - Developing</option>
                          <option value="3">3 - Competent</option>
                          <option value="4">4 - Proficient</option>
                          <option value="5">5 - Expert</option>
                        </select>
                      </div>
                      <textarea
                        placeholder="Add comments..."
                        className="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewAssessmentModal(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}