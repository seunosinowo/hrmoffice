import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";
import { supabase } from "../../lib/supabase";

// Add redirectPath property to Window interface
declare global {
  interface Window {
    redirectPath?: string;
  }
}

export default function WelcomePage() {
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) throw refreshError;

          if (!newSession) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              navigate('/auth/login', { replace: true });
            } else {
              window.location.href = 'https://hrmoffice.vercel.app/auth/login';
            }
            return;
          }
        }

        // Get user data
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (user) {
          // Extract name from email or use email as fallback
          const emailName = user.email?.split('@')[0] || '';
          const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          setUserName(displayName);

          // Fetch user roles
          const { data: roleAssignments, error: roleError } = await supabase
            .from('user_role_assignments')
            .select('role_id')
            .eq('user_id', user.id);

          if (roleError) {
            console.error('Error fetching roles:', roleError);
          }

          let redirectPath = '/';

          if (roleAssignments && roleAssignments.length > 0) {
            // Get role names
            const roleIds = roleAssignments.map(ra => ra.role_id);
            const { data: roles } = await supabase
              .from('roles')
              .select('role_name')
              .in('id', roleIds);

            const roleNames = roles?.map(r => r.role_name) || [];

            // Set redirect path based on highest role
            if (roleNames.includes('hr')) {
              redirectPath = '/hr/page-description';
            } else if (roleNames.includes('assessor')) {
              redirectPath = '/assessor/page-description';
            } else {
              redirectPath = '/page-description';
            }
          }

          // Store the redirect path for the button click
          window.redirectPath = redirectPath;

          // Automatically redirect after 10 seconds
          const redirectTimer = setTimeout(() => {
            console.log("Redirecting to dashboard:", redirectPath);
            // Always use Vercel URL for consistency
            window.location.href = `https://hrmoffice.vercel.app${redirectPath}`;
          }, 10000);

          return () => clearTimeout(redirectTimer);
        } else {
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            navigate('/auth/login', { replace: true });
          } else {
            window.location.href = 'https://hrmoffice.vercel.app/auth/login';
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data. Please try again.");
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          navigate('/auth/login', { replace: true });
        } else {
          window.location.href = 'https://hrmoffice.vercel.app/auth/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="absolute top-4 right-4">
            <ThemeToggleButton />
          </div>
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Error
            </h2>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <div className="mt-4">
              <Link
                to="/auth/login"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Return to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-between items-center">
          <div></div>
          <ThemeToggleButton />
        </div>

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <svg className="h-10 w-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome, {userName}!
          </h2>

          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Your account has been successfully verified.
          </p>

          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">You're all set!</h3>

            <div className="space-y-4 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-gray-700 dark:text-gray-300">Your email has been verified</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-gray-700 dark:text-gray-300">Your account is now fully activated</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-gray-700 dark:text-gray-300">You can now access all features of the platform</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => {
                  const redirectPath = window.redirectPath || '/';
                  console.log("Button clicked, redirecting to:", redirectPath);
                  // Always use Vercel URL for consistency
                  window.location.href = `https://hrmoffice.vercel.app${redirectPath}`;
                }}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                Continue to Dashboard
              </button>
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                You will be automatically redirected in 10 seconds...
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help? <Link to="/resources" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Visit our resources</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}