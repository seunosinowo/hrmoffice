import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";

export default function EmailConfirmation() {
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Get the hash part of the URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const token_hash = params.get("token_hash") || searchParams.get("token_hash");
    const type = params.get("type") || searchParams.get("type");
    const error = params.get("error") || searchParams.get("error");
    const error_description = params.get("error_description") || searchParams.get("error_description");
    
    console.log("Verification params:", { token_hash, type, error, error_description });
    
    if (error) {
      setError(error_description || "Verification failed. The link may have expired.");
      return;
    }
    
    if (token_hash && type === "email") {
      setVerifying(true);
      verifyEmail(token_hash);
    } else {
      setError("Invalid verification link. Please try signing up again.");
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyEmail = async (token_hash: string) => {
    try {
      console.log("Verifying email with token:", token_hash);
      
      // First, verify the email
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: "email"
      });

      if (verifyError) {
        console.error("Verification error:", verifyError);
        throw verifyError;
      }

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }

      if (session) {
        console.log("Session found, redirecting to welcome page");
        // For local development, use navigate
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          navigate("/auth/welcome", { replace: true });
        } else {
          // For production, redirect to Vercel
          window.location.href = 'https://hrmoffice.vercel.app/auth/welcome';
        }
      } else {
        console.log("No session found, trying to refresh");
        // If no session, try to refresh it
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Refresh error:", refreshError);
          throw refreshError;
        }

        if (newSession) {
          console.log("New session created, redirecting to welcome page");
          // For local development, use navigate
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            navigate("/auth/welcome", { replace: true });
          } else {
            // For production, redirect to Vercel
            window.location.href = 'https://hrmoffice.vercel.app/auth/welcome';
          }
        } else {
          throw new Error("No session found after verification");
        }
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(error.message || "Failed to verify email. Please try again.");
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="absolute top-4 right-4">
            <ThemeToggleButton />
          </div>
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Verifying your email...
            </h2>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address.
            </p>
          </div>
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
              Verification Failed
            </h2>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <div className="mt-4 space-y-4">
              <Link
                to="/auth/login"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Return to login
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If you need a new verification link, please try signing up again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="absolute top-4 right-4">
          <ThemeToggleButton />
        </div>
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent you an email with a confirmation link. Please check your inbox and click the link to verify your email address.
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