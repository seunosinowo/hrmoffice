import { BuildingOfficeIcon, UserGroupIcon, RocketLaunchIcon, HeartIcon } from "@heroicons/react/24/outline";
import { ReactNode } from "react";

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Revolutionizing HR Management
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Empowering businesses and individuals with modern workforce solutions since 2023
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          <StatCard 
            icon={<UserGroupIcon className="h-10 w-10 text-blue-500" />} 
            value="10,000+" 
            label="Happy Users" 
          />
          <StatCard 
            icon={<BuildingOfficeIcon className="h-10 w-10 text-green-500" />} 
            value="500+" 
            label="Businesses" 
          />
          <StatCard 
            icon={<RocketLaunchIcon className="h-10 w-10 text-purple-500" />} 
            value="95%" 
            label="Adoption Rate" 
          />
          <StatCard 
            icon={<HeartIcon className="h-10 w-10 text-red-500" />} 
            value="24/7" 
            label="Support" 
          />
        </div>

        {/* Story Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-10 mb-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Digital Energy and Integrated Services Limited was incorporated as a wholly indigenous 
            provider of integrated engineering, Procurement, production and flow assurance solutions 
            to operators of oil & gas and hydrocarbon processing facilities. Since its inception, 
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Digital Energy has successfully executed projects for various companies including IOCs 
            and local operators in the Nigerian Petroleum industry.
          </p>
        </div>

        {/* Team Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-10 text-center">
            Meet The Leadership
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TeamMember 
              name="Mrs Amara Jennifer" 
              role="CEO" 
              bio="20+ years in HR tech innovation"
              imgSrc="/images/user/owner.jpeg"
            />
            <TeamMember 
              name="Mrs Amara Jennifer" 
              role="CTO" 
              bio="Cloud architecture specialist"
              imgSrc="/images/user/owner.jpeg"
            />
            <TeamMember 
              name="Mrs Amara Jennifer" 
              role="CFO" 
              bio="HR transformation expert"
              imgSrc="/images/user/owner.jpeg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable components
function StatCard({ icon, value, label }: { icon: ReactNode, value: string, label: string }) {
  return (
    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="mx-auto h-12 w-12 mb-4">{icon}</div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function TeamMember({ name, role, bio, imgSrc }: { name: string, role: string, bio: string, imgSrc: string }) {
  return (
    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-32 h-32 mx-auto mb-4">
        <img 
          src={imgSrc} 
          alt={name} 
          className="w-full h-full rounded-full object-cover border-4 border-blue-100 dark:border-blue-900"
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
      <p className="text-blue-600 dark:text-blue-400 mb-2">{role}</p>
      <p className="text-gray-600 dark:text-gray-300">{bio}</p>
    </div>
  );
}