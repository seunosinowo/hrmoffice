import { supabase } from '../lib/supabase';

/**
 * Handles Supabase authentication errors by attempting to refresh the session
 * @param error The error object from a Supabase query
 * @returns True if the session was refreshed successfully, false otherwise
 */
export const handleAuthError = async (error: any): Promise<boolean> => {
  // Check if the error is an authentication error
  if (
    error.message?.includes('JWT expired') ||
    error.message?.includes('Invalid JWT') ||
    error.message?.includes('JWT must be provided') ||
    error.message?.includes('not authenticated') ||
    error.message?.includes('Invalid Refresh Token') ||
    error.status === 401
  ) {
    console.log('Authentication error detected, attempting to refresh session');

    try {
      // Try to refresh the session
      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        return false;
      }

      if (data && data.session) {
        console.log('Session refreshed successfully');
        return true;
      }

      return false;
    } catch (refreshError) {
      console.error('Error refreshing session:', refreshError);
      return false;
    }
  }

  // Not an authentication error
  return false;
};

/**
 * Wrapper for Supabase queries that handles authentication errors
 * @param queryFn Function that performs a Supabase query
 * @returns The result of the query function
 */
export const withErrorHandling = async <T>(queryFn: () => Promise<T>): Promise<T> => {
  try {
    return await queryFn();
  } catch (error: any) {
    console.error('Error in Supabase query:', error);

    // Try to handle authentication errors
    const refreshed = await handleAuthError(error);

    if (refreshed) {
      // If session was refreshed, try the query again
      try {
        return await queryFn();
      } catch (retryError) {
        console.error('Error retrying query after session refresh:', retryError);
        throw retryError;
      }
    }

    // If not an auth error or refresh failed, rethrow
    throw error;
  }
};
