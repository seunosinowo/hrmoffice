import { PostgrestError } from '@supabase/supabase-js';

/**
 * A higher-order function that wraps Supabase database operations with error handling
 * 
 * @param operation - The async database operation to perform
 * @param errorMessage - A custom error message to display if the operation fails
 * @returns A tuple containing [data, error]
 */
export async function withErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  errorMessage: string = 'Database operation failed'
): Promise<[T | null, string | null]> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error(`${errorMessage}:`, error);
      return [null, `${errorMessage}: ${error.message}`];
    }
    
    return [data, null];
  } catch (err: any) {
    console.error(`${errorMessage}:`, err);
    return [null, `${errorMessage}: ${err.message || 'Unknown error'}`];
  }
}

/**
 * Formats a Supabase storage URL to ensure it's properly cached or not cached
 * 
 * @param url - The original URL from Supabase storage
 * @param preventCache - Whether to add a timestamp to prevent caching
 * @returns The formatted URL
 */
export function formatStorageUrl(url: string, preventCache: boolean = false): string {
  if (!url) return '';
  
  // If we want to prevent caching, add a timestamp parameter
  if (preventCache) {
    const timestamp = Date.now();
    return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
  }
  
  return url;
}

/**
 * Checks if a Supabase error is a foreign key violation
 * 
 * @param error - The PostgrestError to check
 * @returns True if the error is a foreign key violation
 */
export function isForeignKeyViolation(error: PostgrestError | null): boolean {
  if (!error) return false;
  
  // PostgreSQL error code for foreign key violation is '23503'
  return error.code === '23503';
}

/**
 * Checks if a Supabase error is a unique constraint violation
 * 
 * @param error - The PostgrestError to check
 * @returns True if the error is a unique constraint violation
 */
export function isUniqueConstraintViolation(error: PostgrestError | null): boolean {
  if (!error) return false;
  
  // PostgreSQL error code for unique constraint violation is '23505'
  return error.code === '23505';
}

/**
 * Extracts a user-friendly error message from a Supabase error
 * 
 * @param error - The PostgrestError to extract a message from
 * @param defaultMessage - A default message to return if no specific message can be extracted
 * @returns A user-friendly error message
 */
export function getUserFriendlyErrorMessage(
  error: PostgrestError | null,
  defaultMessage: string = 'An error occurred'
): string {
  if (!error) return defaultMessage;
  
  // Handle specific error types
  if (isUniqueConstraintViolation(error)) {
    return 'This record already exists. Please try with different values.';
  }
  
  if (isForeignKeyViolation(error)) {
    return 'This operation references a record that does not exist.';
  }
  
  // Return the error message or the default message if none exists
  return error.message || defaultMessage;
}

/**
 * Safely parses JSON from a string, returning a default value if parsing fails
 * 
 * @param jsonString - The JSON string to parse
 * @param defaultValue - The default value to return if parsing fails
 * @returns The parsed JSON or the default value
 */
export function safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Checks if a value is a valid UUID
 * 
 * @param value - The value to check
 * @returns True if the value is a valid UUID
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Delays execution for a specified number of milliseconds
 * Useful for rate limiting or adding delays between operations
 * 
 * @param ms - The number of milliseconds to delay
 * @returns A promise that resolves after the specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an operation a specified number of times with exponential backoff
 * 
 * @param operation - The async operation to retry
 * @param maxRetries - The maximum number of retries
 * @param baseDelay - The base delay in milliseconds
 * @returns The result of the operation or throws an error if all retries fail
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Calculate delay with exponential backoff
      const delayTime = baseDelay * Math.pow(2, attempt);
      
      // Wait before next retry
      await delay(delayTime);
    }
  }
  
  throw lastError;
}
