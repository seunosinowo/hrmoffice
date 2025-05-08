import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define types for Supabase responses
interface RoleData {
  role_name: string;
}

type User = {
  id: string;
  email: string;
  roles: string[];
};

type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Function to assign a role to a user directly if RPC function is not available
  const assignRoleDirectly = async (userId: string, roleName: string = 'employee') => {
    try {
      // First check if the role exists
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', roleName)
        .single();

      if (roleError) {
        console.error('Error finding role:', roleError);
        return;
      }

      // Then assign the role to the user
      const { error: assignError } = await supabase
        .from('user_role_assignments')
        .insert([{ user_id: userId, role_id: roleData.id }]);

      if (assignError) {
        console.error('Error assigning role:', assignError);
      }
    } catch (error) {
      console.error('Error in assignRoleDirectly:', error);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    console.log('Fetching roles for user:', userId);

    try {
      // Get the session for logging purposes only
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user && session.user.email) {
        console.log('Fetching roles from Supabase for user:', session.user.email);
      }

      // First try to get roles directly from the user_roles view or table
      console.log('Fetching roles for user ID:', userId);

      // Try different queries to find the user's roles
      // Query 1: Try user_role_assignments table with join
      let { data, error } = await supabase
        .from('user_role_assignments')
        .select(`
          roles:role_id (
            role_name
          )
        `)
        .eq('user_id', userId);

      // If the first query fails, try a direct query to a roles table
      let directRoleNames: string[] = [];

      if (error || !data || data.length === 0) {
        console.log('First query failed or returned no data, trying direct roles query');
        const { data: directData, error: directError } = await supabase
          .from('roles')
          .select('role_name')
          .eq('user_id', userId);

        if (!directError && directData && directData.length > 0) {
          // Extract role names directly
          directRoleNames = directData.map(item => item.role_name).filter(Boolean);
          console.log('Direct roles query found roles:', directRoleNames);

          if (directRoleNames.length > 0) {
            // If we found roles directly, return them immediately
            if (!directRoleNames.includes('employee')) {
              directRoleNames.push('employee');
            }
            return directRoleNames;
          }
        }
      }

      // If both fail, try a user_roles view if it exists
      if (error || !data || data.length === 0) {
        console.log('Second query failed or returned no data, trying user_roles view');
        const { data: viewData, error: viewError } = await supabase
          .from('user_roles')
          .select('role_name')
          .eq('user_id', userId);

        if (!viewError && viewData && viewData.length > 0) {
          // Extract role names directly
          const viewRoleNames = viewData.map(item => item.role_name).filter(Boolean);
          console.log('User roles view found roles:', viewRoleNames);

          if (viewRoleNames.length > 0) {
            // If we found roles from the view, return them immediately
            if (!viewRoleNames.includes('employee')) {
              viewRoleNames.push('employee');
            }
            return viewRoleNames;
          }
        }
      }

      if (error) {
        console.error('Error fetching user roles:', error);
        return ['employee']; // Return default role on error
      }

      // If user has no roles assigned, assign the default 'employee' role
      if (!data || data.length === 0) {
        console.log('No roles found for user, using default employee role');

        // Try to get roles from a different table first
        try {
          // Try to get roles from the user_roles table directly
          const { data: directRoles, error: directError } = await supabase
            .from('user_roles')
            .select('role_name')
            .eq('user_id', userId);

          if (!directError && directRoles && directRoles.length > 0) {
            // Extract role names
            const roleNames = directRoles.map(item => item.role_name).filter(Boolean);
            console.log('Found roles in user_roles table:', roleNames);

            if (roleNames.length > 0) {
              // Ensure employee role is included
              if (!roleNames.includes('employee')) {
                roleNames.push('employee');
              }
              return roleNames;
            }
          }
        } catch (e) {
          console.error('Error fetching roles from user_roles table:', e);
        }

        // If still no roles, try the roles table
        try {
          const { data: rolesData, error: rolesError } = await supabase
            .from('roles')
            .select('*')
            .eq('user_id', userId);

          if (!rolesError && rolesData && rolesData.length > 0) {
            console.log('Found roles in roles table:', rolesData);
            const roleNames = rolesData.map(item => item.role_name || item.name).filter(Boolean);

            if (roleNames.length > 0) {
              // Ensure employee role is included
              if (!roleNames.includes('employee')) {
                roleNames.push('employee');
              }
              return roleNames;
            }
          }
        } catch (e) {
          console.error('Error fetching roles from roles table:', e);
        }

        // Assign the default role in the background, but don't wait for it
        assignRoleDirectly(userId, 'employee').catch(error => {
          console.error('Error assigning default role:', error);
        });

        // Return the default role immediately
        return ['employee'];
      }

      // Extract role names from the joined query result with improved error handling
      try {
        // Improved role extraction
        const roleNames: string[] = [];

        // Check if data exists and has items
        if (data && data.length > 0) {
          console.log('Processing role data:', JSON.stringify(data));

          for (const item of data) {
            // Use type assertion to handle different data structures
            const anyItem = item as any;

            // Handle different data structures that might come from Supabase
            if (anyItem.roles && typeof anyItem.roles === 'object' && 'role_name' in anyItem.roles) {
              // Standard structure from user_role_assignments join
              const roleObj = anyItem.roles as RoleData;
              roleNames.push(roleObj.role_name);
            } else if (anyItem.role_name) {
              // Direct role_name field from roles table or user_roles view
              roleNames.push(anyItem.role_name);
            } else if (typeof anyItem.roles === 'string') {
              // Handle case where roles might be a string
              roleNames.push(anyItem.roles);
            }
          }
        }

        // Always ensure 'employee' is included if the user has any role
        if (roleNames.length > 0 && !roleNames.includes('employee')) {
          roleNames.push('employee');
        }

        console.log('Final extracted roles:', roleNames);

        // If we have valid roles, return them, otherwise return the default role
        return roleNames.length > 0 ? roleNames : ['employee'];
      } catch (error) {
        console.error('Error processing roles:', error);
        return ['employee']; // Return default role on any error
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserRoles:', error);
      return ['employee']; // Return default role on any error
    }
  };

  useEffect(() => {
    // Check for existing session - improved version with error handling and role persistence
    const checkSession = async () => {
      try {
        // First, check if we have cached user roles in localStorage
        const cachedUserData = localStorage.getItem('hrmoffice_user_data');
        let cachedRoles: string[] = [];

        if (cachedUserData) {
          try {
            const parsedData = JSON.parse(cachedUserData);
            if (parsedData && parsedData.roles && Array.isArray(parsedData.roles)) {
              cachedRoles = parsedData.roles;
              console.log('Found cached roles:', cachedRoles);
            }
          } catch (e) {
            console.error('Error parsing cached user data:', e);
          }
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          // Clear any invalid session data
          await supabase.auth.signOut();
          localStorage.removeItem('hrmoffice_user_data');
          setUser(null);
          return;
        }

        if (session) {
          console.log('Found existing session for user:', session.user.email);

          // Set user immediately with cached roles or default role to speed up UI rendering
          const initialRoles = cachedRoles.length > 0 ? cachedRoles : ['employee'];

          setUser({
            id: session.user.id,
            email: session.user.email!,
            roles: initialRoles
          });

          // Then fetch actual roles in the background
          fetchUserRoles(session.user.id).then(roles => {
            console.log('Fetched roles for existing session:', roles);

            // Cache the roles in localStorage for persistence
            localStorage.setItem('hrmoffice_user_data', JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              roles: roles
            }));

            setUser(prevUser => {
              if (prevUser) {
                return { ...prevUser, roles };
              }
              return null;
            });
          }).catch(error => {
            console.error('Error fetching roles during session check:', error);
          });
        } else {
          console.log('No active session found');
          localStorage.removeItem('hrmoffice_user_data');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // On any error, clear the session to be safe
        try {
          await supabase.auth.signOut();
          localStorage.removeItem('hrmoffice_user_data');
        } catch (signOutError) {
          console.error('Error signing out after session check error:', signOutError);
        }
        setUser(null);
      }
    };

    checkSession();

    // Listen for auth changes - improved version with error handling and role persistence
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        localStorage.removeItem('hrmoffice_user_data');
        setUser(null);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
        // No need to update user state on token refresh
        return;
      }

      if (session) {
        // First, check if we have cached user roles in localStorage
        const cachedUserData = localStorage.getItem('hrmoffice_user_data');
        let cachedRoles: string[] = [];

        if (cachedUserData) {
          try {
            const parsedData = JSON.parse(cachedUserData);
            if (parsedData && parsedData.roles && Array.isArray(parsedData.roles)) {
              cachedRoles = parsedData.roles;
              console.log('Found cached roles during auth change:', cachedRoles);
            }
          } catch (e) {
            console.error('Error parsing cached user data during auth change:', e);
          }
        }

        // Set user immediately with cached roles or default role to speed up UI rendering
        const initialRoles = cachedRoles.length > 0 ? cachedRoles : ['employee'];

        setUser({
          id: session.user.id,
          email: session.user.email!,
          roles: initialRoles
        });

        // Then fetch actual roles in the background
        fetchUserRoles(session.user.id).then(roles => {
          console.log('Fetched roles after auth change:', roles);

          // Cache the roles in localStorage for persistence
          localStorage.setItem('hrmoffice_user_data', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            roles: roles
          }));

          setUser(prevUser => {
            if (prevUser) {
              return { ...prevUser, roles };
            }
            return null;
          });
        }).catch(error => {
          console.error('Error fetching roles during auth change:', error);
        });
      } else {
        // If we get here with no session, there might be an issue
        console.warn('Auth state changed but no session available for event:', event);
        localStorage.removeItem('hrmoffice_user_data');
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email);

      // First, ensure any existing session is cleared to prevent token conflicts
      await supabase.auth.signOut();

      // Then sign in with the new credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign-in error:', error.message);
        throw error;
      }

      // If we have a session, pre-fetch the roles to speed up the process
      if (data && data.session && data.user) {
        console.log('Sign-in successful, session established');
        console.log('Session expires at:', new Date(data.session.expires_at! * 1000).toLocaleString());

        // Store the session in localStorage for persistence
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }));

        // This will run in parallel with the auth state change handler
        fetchUserRoles(data.user.id).then(roles => {
          console.log('Pre-fetched roles:', roles);

          // Cache the roles in localStorage for persistence
          localStorage.setItem('hrmoffice_user_data', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            roles: roles
          }));

          // The auth state change handler will set the user with these roles
        }).catch(err => {
          console.error('Error pre-fetching roles:', err);
        });
      } else {
        console.warn('Sign-in successful but no session data returned');
      }

      return data;
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.hostname === 'localhost'
            ? 'http://localhost:5173/auth/welcome'
            : 'https://hrmoffice.vercel.app/auth/welcome',
          data: {
            redirectTo: window.location.hostname === 'localhost'
              ? 'http://localhost:5173/auth/welcome'
              : 'https://hrmoffice.vercel.app/auth/welcome'
          }
        }
      });

      if (error) throw error;

      // If sign up was successful and we have a user, assign the default 'employee' role
      if (data && data.user) {
        try {
          // First try to assign default employee role using RPC function
          const { error: roleError } = await supabase.rpc('assign_default_role', {
            user_id: data.user.id
          });

          if (roleError) {
            console.error('Error assigning default role via RPC:', roleError);
            // If RPC fails, try direct assignment as fallback
            await assignRoleDirectly(data.user.id, 'employee');
          }
        } catch (roleError) {
          console.error('Error assigning default role:', roleError);
          // Try direct assignment as fallback
          await assignRoleDirectly(data.user.id, 'employee');
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');

      // Clear any stored tokens and user data from localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('hrmoffice_user_data');

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error during sign out:', error);
        throw error;
      }

      // Clear user state
      setUser(null);

      console.log('User signed out successfully');
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // Still clear the user state even if there was an error
      setUser(null);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth sign-in');

      // First, ensure any existing session is cleared to prevent token conflicts
      await supabase.auth.signOut();

      // Clear any stored tokens and user data from localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('hrmoffice_user_data');

      // Get the correct redirect URL based on environment
      const redirectUrl = window.location.hostname === 'localhost'
        ? `${window.location.origin}/auth/callback`
        : 'https://hrmoffice.vercel.app/auth/callback';

      console.log('Using redirect URL:', redirectUrl);

      // Start the OAuth flow
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
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}