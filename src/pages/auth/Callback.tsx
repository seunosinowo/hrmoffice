import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Define type for role object from the database
interface RoleData {
  role_name: string;
}

export default function Callback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    // No timeout - we'll handle the process efficiently

    const handleCallback = async () => {
      try {
        console.log('Handling OAuth callback');
        setMessage("Processing authentication...");

        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }

        if (session && session.user) {
          console.log('Session found for user:', session.user.email);

          // Store the session in localStorage for persistence
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at
          }));

          // We have a session, wait a moment for roles to be fetched
          setMessage("Fetching user roles...");

          // Wait a moment for roles to be fetched
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Try to get roles from Supabase directly
          try {
            // First try user_role_assignments table
            const { data, error } = await supabase
              .from('user_role_assignments')
              .select(`
                roles:role_id (
                  role_name
                )
              `)
              .eq('user_id', session.user.id);

            if (!error && data && data.length > 0) {
              // Extract roles
              const roleNames: string[] = [];

              for (const item of data) {
                const anyItem = item as any;
                if (anyItem.roles && typeof anyItem.roles === 'object' && 'role_name' in anyItem.roles) {
                  roleNames.push(anyItem.roles.role_name);
                }
              }

              console.log("Roles found directly:", roleNames);

              // Redirect based on roles
              if (roleNames.includes('hr')) {
                console.log("Redirecting to HR page based on direct roles");
                navigate("/hr/page-description", { replace: true });
                return;
              } else if (roleNames.includes('assessor')) {
                console.log("Redirecting to Assessor page based on direct roles");
                navigate("/assessor/page-description", { replace: true });
                return;
              } else if (roleNames.includes('employee') || roleNames.length > 0) {
                console.log("Redirecting to Employee page based on direct roles");
                navigate("/page-description", { replace: true });
                return;
              }
            }
          } catch (roleError) {
            console.error("Error fetching roles directly:", roleError);
          }

          // If direct role fetch failed, fall back to the standard approach
          await redirectBasedOnRoles(session.user.id);
        } else {
          // If no session, redirect to login
          console.error('No session found after OAuth callback');
          navigate('/auth/login', { replace: true });
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        navigate('/auth/login', { replace: true });
      }
    };

    // Quick redirect function that uses a simplified approach
    const redirectBasedOnRoles = async (userId: string) => {
      try {
        setMessage("Redirecting...");

        // First, check if we can determine the role from the user's email
        const { data: { session } } = await supabase.auth.getSession();

        if (session && session.user && session.user.email) {
          const userEmail = session.user.email;

          // Skip email pattern matching and go directly to database query
          console.log("Skipping email pattern matching, will use database roles for:", userEmail);
        }

        // Use a more robust approach to query roles from multiple tables
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

        // If that fails, try a direct query to a roles table
        if (error || !data || data.length === 0) {
          console.log("First query failed, trying direct roles query");
          const { data: directData, error: directError } = await supabase
            .from('roles')
            .select('role_name')
            .eq('user_id', userId);

          if (!directError && directData && directData.length > 0) {
            console.log("Found roles in direct query:", directData);
            // Create a compatible data structure with type assertion
            data = directData.map(item => ({
              roles: { role_name: item.role_name }
            })) as any;
            error = null;
          }
        }

        // If both fail, try a user_roles view if it exists
        if (error || !data || data.length === 0) {
          console.log("Second query failed, trying user_roles view");
          const { data: viewData, error: viewError } = await supabase
            .from('user_roles')
            .select('role_name')
            .eq('user_id', userId);

          if (!viewError && viewData && viewData.length > 0) {
            console.log("Found roles in user_roles view:", viewData);
            // Create a compatible data structure with type assertion
            data = viewData.map(item => ({
              roles: { role_name: item.role_name }
            })) as any;
            error = null;
          }
        }

        if (error) {
          console.error('Error fetching roles:', error);
          // Default to employee page on error
          navigate("/page-description", { replace: true });
          return;
        }

        // If no roles found or data is empty, go to default employee page
        if (!data || data.length === 0 || !data[0].roles) {
          console.log("No roles found, redirecting to default employee page");
          navigate("/page-description", { replace: true });
          return;
        }

        // Extract the role name from the first role
        let roleName = '';

        // Safely extract the role name
        if (data[0].roles && typeof data[0].roles === 'object' && 'role_name' in data[0].roles) {
          const roleObj = data[0].roles as RoleData;
          roleName = roleObj.role_name;
        }

        console.log("First role found:", roleName);

        // Redirect based on the first role
        if (roleName === 'hr') {
          console.log("Redirecting to HR page");
          navigate("/hr/page-description", { replace: true });
        } else if (roleName === 'assessor') {
          console.log("Redirecting to Assessor page");
          navigate("/assessor/page-description", { replace: true });
        } else if (roleName === 'employee' || roleName === '') {
          console.log("Redirecting to Employee page");
          navigate("/page-description", { replace: true });
        } else {
          console.log("Unknown role, defaulting to Employee page:", roleName);
          navigate("/page-description", { replace: true });
        }
      } catch (error) {
        console.error("Error in redirectBasedOnRoles:", error);
        // Default to employee page on any error
        navigate("/page-description", { replace: true });
      }
    };

    handleCallback();

    // No cleanup needed
    return () => {};
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}