
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Unauthorized() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>

          {user && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Logged in as: <span className="font-medium">{user.email}</span>
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Roles: <span className="font-medium">{user.roles.join(', ') || 'None'}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <Link
            to="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Home Page
          </Link>

          {user && user.roles.includes('hr') && (
            <Link
              to="/hr/page-description"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Go to HR Dashboard
            </Link>
          )}

          {user && user.roles.includes('assessor') && (
            <Link
              to="/assessor/page-description"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Go to Assessor Dashboard
            </Link>
          )}

          {user && user.roles.includes('employee') && (
            <Link
              to="/page-description"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Employee Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
