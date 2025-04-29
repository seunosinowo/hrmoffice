import { useState } from 'react';
import { 
  PencilIcon, 
  TrashBinIcon,
  UserIcon,
  ChatIcon,
  BoxIcon
} from "../../icons";

interface ConsensusAssessment {
  id: number;
  employee: {
    id: number;
    name: string;
    position: string;
    department: string;
  };
  assessors: {
    id: number;
    name: string;
    role: string;
  }[];
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
  overall_rating: number;
  competencies: {
    name: string;
    ratings: {
      assessor: string;
      rating: number;
      comments: string;
    }[];
    consensus_rating: number;
    consensus_comments: string;
  }[];
}

const mockAssessments: ConsensusAssessment[] = [
  {
    id: 1,
    employee: {
      id: 101,
      name: "John David",
      position: "Senior Developer",
      department: "Engineering"
    },
    assessors: [
      { id: 201, name: "Sarah Smith", role: "Team Lead" },
      { id: 202, name: "Michael Johnson", role: "Project Manager" },
      { id: 203, name: "Emily Davis", role: "HR Manager" }
    ],
    date: "2024-03-15",
    status: "In Progress",
    overall_rating: 4.2,
    competencies: [
      {
        name: "Technical Skills",
        ratings: [
          { assessor: "Sarah Smith", rating: 5, comments: "Excellent technical knowledge" },
          { assessor: "Michael Johnson", rating: 4, comments: "Strong technical abilities" },
          { assessor: "Emily Davis", rating: 4, comments: "Good technical foundation" }
        ],
        consensus_rating: 4.3,
        consensus_comments: "Strong technical skills across all areas"
      },
      {
        name: "Communication",
        ratings: [
          { assessor: "Sarah Smith", rating: 4, comments: "Clear communicator" },
          { assessor: "Michael Johnson", rating: 3, comments: "Could improve in technical documentation" },
          { assessor: "Emily Davis", rating: 4, comments: "Good interpersonal skills" }
        ],
        consensus_rating: 3.7,
        consensus_comments: "Generally good communication skills, room for improvement in documentation"
      }
    ]
  }
];

export default function ConsensusAssessment() {
  const [assessments] = useState<ConsensusAssessment[]>(mockAssessments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<ConsensusAssessment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filteredAssessments = assessments.filter(assessment =>
    assessment.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Consensus Assessment</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage and track consensus-based competency assessments</p>
        </div>
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
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Assessors</h4>
              <div className="mt-2 space-y-2">
                {assessment.assessors.map((assessor) => (
                  <div key={assessor.id} className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {assessor.name} ({assessor.role})
                    </span>
                  </div>
                ))}
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
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Consensus Assessment Details
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
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                  <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(selectedAssessment.status)}`}>
                    {selectedAssessment.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Competency Ratings</h3>
                <div className="mt-4 space-y-6">
                  {selectedAssessment.competencies.map((competency, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {competency.name}
                        </h4>
                        <div className="flex items-center gap-1">
                          <ChatIcon className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {competency.consensus_rating}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {competency.consensus_comments}
                      </p>
                      <div className="mt-4 space-y-3">
                        {competency.ratings.map((rating, idx) => (
                          <div key={idx} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {rating.assessor}
                              </span>
                              <div className="flex items-center gap-1">
                                <ChatIcon className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {rating.rating}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {rating.comments}
                            </p>
                          </div>
                        ))}
                      </div>
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
    </div>
  );
}