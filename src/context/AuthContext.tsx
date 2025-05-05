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

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .rpc('get_user_role_names', { user_id: userId });
      
      if (error) throw error;
      return roles || [];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  };

  useEffect(() => {
    
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
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (session) {
      const roles = await fetchUserRoles(session.user.id);
      setUser({
        id: session.user.id,
        email: session.user.email!,
        roles
      });
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
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