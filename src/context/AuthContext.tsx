import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type User = {
  id: string;
  email: string;
  roles: string[];
};

type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
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
    let userRoleAssignments;

    const { data: initialRoleAssignments, error } = await supabase
      .from('user_role_assignments')
      .select('role_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    userRoleAssignments = initialRoleAssignments;

    // If user has no roles assigned, assign the default 'employee' role
    if (!userRoleAssignments || userRoleAssignments.length === 0) {
      console.log('No roles found for user, assigning default employee role');
      await assignRoleDirectly(userId, 'employee');

      // Fetch the roles again after assignment
      const { data: updatedRoleAssignments, error: updateError } = await supabase
        .from('user_role_assignments')
        .select('role_id')
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error fetching updated user roles:', updateError);
        return ['employee']; // Return default role even if fetch fails
      }

      if (updatedRoleAssignments && updatedRoleAssignments.length > 0) {
        userRoleAssignments = updatedRoleAssignments;
      } else {
        return ['employee']; // Return default role if assignment didn't work
      }
    }

    // Get role names for the role_ids
    const roleIds = userRoleAssignments.map(ra => ra.role_id);

    if (roleIds.length === 0) {
      return ['employee']; // Return default role if no role IDs found
    }

    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('role_name')
      .in('id', roleIds);

    if (rolesError) {
      console.error('Error fetching role names:', rolesError);
      return ['employee']; // Return default role if fetch fails
    }

    if (!roles || roles.length === 0) {
      return ['employee']; // Return default role if no roles found
    }

    console.log('Fetched roles:', roles);
    return roles.map(role => role.role_name);
  };

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const roles = await fetchUserRoles(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          roles
        });
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const roles = await fetchUserRoles(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          roles
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.hostname === 'localhost'
          ? 'http://localhost:5173/auth/callback'
          : 'https://hrmoffice.vercel.app/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
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