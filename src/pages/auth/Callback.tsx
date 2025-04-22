import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Redirect to welcome page
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            navigate('/auth/welcome', { replace: true });
          } else {
            window.location.href = 'https://hrmoffice.vercel.app/auth/welcome';
          }
        } else {
          // If no session, try to refresh it
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) throw refreshError;
          
          if (newSession) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              navigate('/auth/welcome', { replace: true });
            } else {
              window.location.href = 'https://hrmoffice.vercel.app/auth/welcome';
            }
          } else {
            throw new Error('No session found after OAuth callback');
          }
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          navigate('/auth/login', { replace: true });
        } else {
          window.location.href = 'https://hrmoffice.vercel.app/auth/login';
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
} 