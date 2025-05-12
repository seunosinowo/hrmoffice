import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// No need for RoleData interface anymore

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const navigate = useNavigate();
  const { signIn } = useAuth(); // We're not using user from useAuth() anymore

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setLoadingMessage("Authenticating...");

    try {
      console.log("Starting authentication for:", email);

      // Sign in using the signIn function from useAuth
      await signIn(email, password);

      // After successful sign-in, get the session directly from Supabase
      setLoadingMessage("Fetching user session...");

      // Get the session directly from Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user) {
        throw new Error("Authentication failed - no session data returned");
      }

      const userId = session.user.id;
      const userEmail = session.user.email || '';

      console.log("Authentication successful:", userId);
      console.log("User email:", userEmail);

      // Redirect based on session data
      setLoadingMessage("Redirecting...");

      // Skip the context check and go directly to role-based redirection
      await fastRedirectBasedOnRoles(userId);
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : 'An error occurred during login');
      setLoading(false);
    }
  };



  // First implementation removed to avoid duplicate function names

  // Fast redirect function that uses a simplified approach
  const fastRedirectBasedOnRoles = async (userId: string) => {
    try {
      // First, immediately check if we have a cached user with roles
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user) {
        // Try to get the user's email from the session
        const userEmail = session.user.email;

        // Simple role mapping based on email patterns
        // This is a fast way to determine roles without additional database queries
        if (userEmail) {
          // Skip email pattern matching and go directly to database query
          console.log("Skipping email pattern matching, will use database roles for:", userEmail);
        }
      }

      // Query roles from multiple tables to ensure we get the correct roles
      console.log("Querying roles from database for user ID:", userId);

      // First try user_role_assignments table
      let { data, error } = await supabase
        .from('user_role_assignments')
        .select(`
          roles:role_id (
            role_name
          )
        `)
        .eq('user_id', userId);

      // Variables to store direct role data
      let directRoleData: any[] = [];
      let hasDirectRoles = false;

      // If that fails, try a direct query to a roles table
      if (error || !data || data.length === 0) {
        console.log("First query failed, trying direct roles query");
        const { data: directData, error: directError } = await supabase
          .from('roles')
          .select('*')
          .eq('user_id', userId);

        if (!directError && directData && directData.length > 0) {
          console.log("Found roles in direct query:", directData);
          directRoleData = directData;
          hasDirectRoles = true;
        }
      }

      // If both fail, try a user_roles view if it exists
      if ((error || !data || data.length === 0) && !hasDirectRoles) {
        console.log("Second query failed, trying user_roles view");
        const { data: viewData, error: viewError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId);

        if (!viewError && viewData && viewData.length > 0) {
          console.log("Found roles in user_roles view:", viewData);
          directRoleData = viewData;
          hasDirectRoles = true;
        }
      }

      // If all queries fail, try one more approach - query the user_roles table
      if ((error || !data || data.length === 0) && !hasDirectRoles) {
        console.log("All previous queries failed, trying user_roles table");
        try {
          // Try to get all tables to see what's available
          const { data: tablesData } = await supabase
            .rpc('get_tables');

          console.log("Available tables:", tablesData);

          // Try a few more table names that might exist
          const tableNames = ['user_role', 'user_roles', 'roles', 'role_assignments'];

          for (const tableName of tableNames) {
            console.log(`Trying table: ${tableName}`);
            const { data: tableData, error: tableError } = await supabase
              .from(tableName)
              .select('*')
              .eq('user_id', userId);

            if (!tableError && tableData && tableData.length > 0) {
              console.log(`Found roles in ${tableName} table:`, tableData);
              directRoleData = tableData;
              hasDirectRoles = true;
              break;
            }
          }
        } catch (e) {
          console.error("Error in additional role queries:", e);
        }
      }

      if (error) {
        console.error('Error fetching roles:', error);
        // Default to employee page on error
        navigate("/page-description");
        setLoading(false);
        return;
      }

      // Process roles from either the joined query or direct queries
      let roleName = '';
      let roleNames: string[] = [];

      // Check if we have direct roles from alternative queries
      if (hasDirectRoles && directRoleData.length > 0) {
        // Try to extract roles from the direct data
        for (const item of directRoleData) {
          if (item.role_name) {
            roleNames.push(item.role_name);
          } else if (item.name) {
            roleNames.push(item.name);
          } else if (item.roles && typeof item.roles === 'object' && 'role_name' in item.roles) {
            roleNames.push(item.roles.role_name);
          }
        }

        if (roleNames.length > 0) {
          console.log("Using direct roles:", roleNames);

          // Determine the highest priority role
          if (roleNames.includes('hr')) {
            roleName = 'hr';
          } else if (roleNames.includes('assessor')) {
            roleName = 'assessor';
          } else if (roleNames.includes('employee')) {
            roleName = 'employee';
          } else {
            roleName = roleNames[0]; // Use the first role if none of the known roles are found
          }
        }
      }
      // Otherwise try to extract from the original query
      else if (data && data.length > 0) {
        // Extract all roles from the data using type assertion
        for (const item of data) {
          const anyItem = item as any;
          if (anyItem.roles && typeof anyItem.roles === 'object' && 'role_name' in anyItem.roles) {
            roleNames.push(anyItem.roles.role_name);
          } else if (anyItem.role_name) {
            roleNames.push(anyItem.role_name);
          }
        }

        if (roleNames.length > 0) {
          console.log("Using joined roles:", roleNames);

          // Determine the highest priority role
          if (roleNames.includes('hr')) {
            roleName = 'hr';
          } else if (roleNames.includes('assessor')) {
            roleName = 'assessor';
          } else if (roleNames.includes('employee')) {
            roleName = 'employee';
          } else {
            roleName = roleNames[0]; // Use the first role if none of the known roles are found
          }
        }
      }

      // If no roles found, default to employee
      if (!roleName) {
        console.log("No roles found, defaulting to employee");
        roleName = 'employee';
      }

      console.log("Final role determined:", roleName);

      // Redirect based on the first role
      if (roleName === 'hr') {
        console.log("Redirecting to HR page");
        navigate("/hr/page-description");
      } else if (roleName === 'assessor') {
        console.log("Redirecting to Assessor page");
        navigate("/assessor/page-description");
      } else if (roleName === 'employee' || roleName === '') {
        console.log("Redirecting to Employee page");
        navigate("/page-description");
      } else {
        console.log("Unknown role, defaulting to Employee page:", roleName);
        navigate("/page-description");
      }
    } catch (error) {
      console.error("Error in fastRedirectBasedOnRoles:", error);
      // Default to employee page on any error
      navigate("/page-description");
    } finally {
      // Always ensure loading state is cleared
      setLoading(false);
    }
  };

  // Legacy function removed - was not being used

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Initiating Google sign-in...");

      // First, ensure any existing session is cleared to prevent token conflicts
      await supabase.auth.signOut();

      // Clear any stored tokens from localStorage
      localStorage.removeItem('supabase.auth.token');

      // Get the correct redirect URL based on environment
      const redirectUrl = window.location.hostname === 'localhost'
        ? `${window.location.origin}/auth/callback`
        : 'https://hrmoffice.vercel.app/auth/callback';

      console.log('Using Google OAuth redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Error starting Google OAuth flow:', error);
        throw error;
      }

      console.log('Google OAuth flow started successfully');

      // Note: For Google sign-in, the user will be redirected to the OAuth provider,
      // so we don't need to handle redirection here. The Callback component will
      // handle the redirection after the OAuth flow completes.
    } catch (error: any) {
      console.error('Error in Google sign-in:', error);
      setError(error.message);
      setLoading(false);
    }
    // Don't set loading to false here as the user will be redirected away
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ← Back to Dashboard
          </Link>
          <ThemeToggleButton />
        </div>

        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{" "}
            <Link
              to="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {loading && !error && (
            <div className="bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-3 rounded-md text-sm flex items-center">
              <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {loadingMessage || "Signing in..."}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 mb-4"
                placeholder="Email&nbsp;address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 mb-4"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {loadingMessage || "Signing in..."}
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}