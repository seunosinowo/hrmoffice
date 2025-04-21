import { 
  BookOpenIcon, 
  PlayCircleIcon, 
  DocumentTextIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CogIcon
} from "@heroicons/react/24/outline";

export default function ResourcesPage() {
  const resources = [
    {
      title: "HR Fundamentals Guide",
      desc: "Master core HR processes from hiring to offboarding",
      icon: <BookOpenIcon className="h-8 w-8 text-indigo-600" />,
      category: "Essentials",
      action: "Read Guide"
    },
    {
      title: "Employee Onboarding Kit",
      desc: "Templates and checklists for seamless onboarding",
      icon: <UserGroupIcon className="h-8 w-8 text-blue-600" />,
      category: "Templates",
      action: "Get Templates"
    },
    {
      title: "Compliance Masterclass",
      desc: "Video series on latest labor regulations",
      icon: <ShieldCheckIcon className="h-8 w-8 text-emerald-600" />,
      category: "Training",
      action: "Watch Videos"
    },
    {
      title: "People Analytics Handbook",
      desc: "Turn HR data into actionable insights",
      icon: <ChartBarIcon className="h-8 w-8 text-purple-600" />,
      category: "Analytics",
      action: "Download"
    },
    {
      title: "Leadership Development",
      desc: "Curriculum for building management skills",
      icon: <AcademicCapIcon className="h-8 w-8 text-amber-600" />,
      category: "Courses",
      action: "Start Course"
    },
    {
      title: "Policy Builder Tool",
      desc: "Create custom HR policies in minutes",
      icon: <DocumentTextIcon className="h-8 w-8 text-red-600" />,
      category: "Tools",
      action: "Try Tool"
    },
    {
      title: "Platform Tutorials",
      desc: "Step-by-step system walkthroughs",
      icon: <PlayCircleIcon className="h-8 w-8 text-sky-600" />,
      category: "How-To",
      action: "View Tutorials"
    },
    {
      title: "System Configuration Guide",
      desc: "Advanced setup for your organization",
      icon: <CogIcon className="h-8 w-8 text-gray-600" />,
      category: "Admin",
      action: "Read Docs"
    }
  ];

  const categories = [...new Set(resources.map(r => r.category))];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            HRM Resource Center
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to optimize your HR operations
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md hover:bg-blue-700 transition-colors">
            All Resources
          </button>
          {categories.map((category) => (
            <button 
              key={category} 
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg text-sm font-medium shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {resources.map((resource) => (
            <div 
              key={resource.title} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
            >
              <div className="p-6 h-full flex flex-col">
                <div className="mb-4 p-3 bg-blue-50 dark:bg-gray-700 rounded-lg w-12 h-12 flex items-center justify-center">
                  {resource.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {resource.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-5 flex-grow">
                  {resource.desc}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                    {resource.category}
                  </span>
                  <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                    {resource.action}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Knowledge Base CTA */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Can't find what you need?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Explore our comprehensive knowledge base with hundreds of articles, 
                troubleshooting guides, and best practices for HR professionals.
              </p>
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end">
              <button className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors">
                Browse All Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}