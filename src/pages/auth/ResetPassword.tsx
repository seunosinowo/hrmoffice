import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  // Check if we have a valid session for password reset
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Log the full URL for debugging
        console.log("Current URL:", window.location.href);

        // Check for hash parameters (Supabase sometimes puts tokens in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        console.log("Hash params:", { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        // Check for query parameters
        const queryParams = new URLSearchParams(window.location.search);
        const queryType = queryParams.get("type");
        const queryToken = queryParams.get("token");

        console.log("Query params:", { type: queryType, token: !!queryToken });

        // Check if we have a recovery type in either hash or query params
        if ((type === "recovery" || queryType === "recovery") && (accessToken || queryToken)) {
          console.log("Valid recovery parameters found in URL");
          setHasToken(true);
          return;
        }

        // If no token in URL, check if we have an active session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setError("Session error. Please request a new password reset link.");
          return;
        }

        if (data && data.session) {
          console.log("Valid session found for password reset");
          setHasToken(true);
          return;
        }

        // If we get here, no valid token was found
        console.log("No valid token found");
        setError("No access token found. Please request a new password reset link. Password reset links are valid for a limited time (usually 24 hours).");
      } catch (err) {
        console.error("Error checking session:", err);
        setError("An error occurred. Please request a new password reset link.");
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error("Error updating password:", error);
        throw error;
      }

      console.log("Password updated successfully");
      setSuccess(true);

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (error: any) {
      setError(error.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
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
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        {error && !hasToken && (
          <div className="mt-8 space-y-6">
            <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-md">
              <p className="font-medium mb-2">Password Reset Link Invalid or Expired</p>
              <p className="text-sm mb-2">
                The password reset link you're using is invalid or has expired. Password reset links are valid for 24 hours after they are created.
              </p>
              <p className="text-sm">Please request a new password reset link to continue.</p>
            </div>

            <div className="text-center mt-6">
              <Link
                to="/auth/forgot-password"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Request new reset link
              </Link>

              <div className="mt-4">
                <Link
                  to="/auth/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        )}

        {hasToken && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-3 rounded-md text-sm">
                Password reset successful! Redirecting to login page...
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="sr-only">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800 mb-4"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || success}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting password...
                  </span>
                ) : (
                  "Reset password"
                )}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link
                to="/auth/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
