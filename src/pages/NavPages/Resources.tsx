import { BookOpenIcon, VideoCameraIcon, DocumentTextIcon, AcademicCapIcon } from "@heroicons/react/24/outline";

export default function ResourcesPage() {
  const resources = [
    {
      title: "HR Playbook",
      desc: "Complete guide to modern HR practices",
      type: "Guide",
      icon: <BookOpenIcon className="h-6 w-6 text-blue-500" />,
      category: "HR Basics"
    },
    {
      title: "Onboarding Webinar",
      desc: "60-minute masterclass on employee onboarding",
      type: "Video",
      icon: <VideoCameraIcon className="h-6 w-6 text-red-500" />,
      category: "Training"
    },
    {
      title: "Compliance Checklist",
      desc: "2023 labor law requirements by state",
      type: "Template",
      icon: <DocumentTextIcon className="h-6 w-6 text-green-500" />,
      category: "Legal"
    },
    {
      title: "Leadership Training",
      desc: "Developing your management team",
      type: "Course",
      icon: <AcademicCapIcon className="h-6 w-6 text-purple-500" />,
      category: "Development"
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Resource Center
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Expert-created materials to help you get the most from our platform
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
            All Resources
          </button>
          {["HR Basics", "Training", "Legal", "Development"].map((cat) => (
            <button 
              key={cat} 
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {resources.map((resource) => (
            <div 
              key={resource.title} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-gray-700 mr-4">
                    {resource.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {resource.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {resource.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {resource.desc}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-300">
                    {resource.category}
                  </span>
                  <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    Download →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Get Monthly HR Insights
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join 10,000+ HR professionals receiving our exclusive newsletter with
            industry trends, platform tips, and expert interviews.
          </p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your work email"
              className="flex-1 px-4 py-3 rounded-l-lg focus:outline-none"
            />
            <button className="bg-indigo-800 hover:bg-indigo-900 text-white px-6 py-3 rounded-r-lg font-medium">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}