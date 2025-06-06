import { supabase } from '../lib/supabase';

/**
 * Uploads an image file to Supabase storage
 * @param file The file to upload
 * @param bucketName The name of the storage bucket
 * @returns The public URL of the uploaded file
 */
export const uploadImage = async (file: File, bucketName: string): Promise<string | null> => {
  try {
    console.log(`Starting image upload process for file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error('File size must be less than 2MB');
      return null;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.error('File type must be JPEG, JPG, or PNG');
      return null;
    }

    // Check if bucket exists, create if it doesn't
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) {
      console.warn(`Bucket ${bucketName} does not exist. Attempting to create it...`);
      const created = await createBucket(bucketName);
      if (!created) {
        console.error(`Failed to create bucket ${bucketName}`);
        return null;
      }
    }

    // Check and fix bucket permissions
    const permissionsOk = await checkAndFixBucketPermissions(bucketName);
    if (!permissionsOk) {
      console.error(`Bucket ${bucketName} permissions are not correctly configured.`);
      console.warn('Please check the Supabase dashboard for storage permissions.');
      return null;
    }

    // Generate a unique file name with proper extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload the file to Supabase storage
    console.log(`Uploading file to Supabase storage: ${fileName}, Type: ${file.type}, Size: ${file.size} bytes`);

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
        contentType: file.type // Explicitly set the content type
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('Generated public URL:', data.publicUrl);

    // Add cache-busting parameter to the URL
    const cacheBustUrl = `${data.publicUrl}?t=${Date.now()}`;

    // Verify the URL is accessible - but don't fail if verification fails
    try {
      console.log(`Attempting to verify URL accessibility: ${cacheBustUrl}`);

      // Make a HEAD request with no-cache headers
      const response = await fetch(cacheBustUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      console.log(`URL verification response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.warn(`URL verification failed after upload: ${response.status} ${response.statusText}`);
        // IMPORTANT: Even if verification fails, we'll still return the URL
        console.log(`Returning URL despite verification failure: ${data.publicUrl}`);
      } else {
        console.log(`URL verified successfully after upload: ${cacheBustUrl}`);
      }

      // Double-check that the URL doesn't contain 'default-avatar'
      if (data.publicUrl.includes('default-avatar')) {
        console.error('Error: URL contains default-avatar string, which indicates it\'s not a real uploaded image');
        return null;
      }

      // ALWAYS return the original URL without cache-busting parameter
      return data.publicUrl;
    } catch (fetchError) {
      console.error('Error verifying URL after upload:', fetchError);
      console.log('Error details:', fetchError);

      // IMPORTANT: Continue anyway, as the upload might have succeeded
      console.log(`Returning URL despite verification error: ${data.publicUrl}`);
      return data.publicUrl;
    }
  } catch (error) {
    console.error('Error in upload process:', error);
    return null;
  }
};

/**
 * Checks if a bucket exists in Supabase storage
 * This function doesn't require admin privileges
 * @param bucketName The name of the bucket to check
 * @returns A boolean indicating if the bucket exists
 */
export const checkBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Try to list files in the bucket
    // If the bucket doesn't exist, this will return an error
    const { error } = await supabase.storage
      .from(bucketName)
      .list();

    // If there's no error, the bucket exists
    return !error;
  } catch (error) {
    console.error('Error checking bucket existence:', error);
    return false;
  }
};

/**
 * Creates a bucket in Supabase storage
 * Note: This requires admin privileges or appropriate policies
 * @param bucketName The name of the bucket to create
 * @returns A boolean indicating if the bucket was created successfully
 */
export const createBucket = async (bucketName: string): Promise<boolean> => {
  try {
    // This is a workaround since the Supabase JS client doesn't have a direct method to create buckets
    // You would typically do this through the Supabase dashboard or with admin privileges
    console.warn(`Bucket creation requires admin privileges. Please create the bucket "${bucketName}" manually in the Supabase dashboard.`);
    return false;
  } catch (error) {
    console.error('Error creating bucket:', error);
    return false;
  }
};

/**
 * Checks if a file exists in a bucket and returns its URL
 * @param bucketName The name of the bucket
 * @param fileName The name of the file
 * @returns The public URL of the file, or null if it doesn't exist
 */
export const getFileUrl = async (bucketName: string, fileName: string): Promise<string | null> => {
  try {
    // First check if the bucket exists
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) {
      console.warn(`Bucket ${bucketName} does not exist`);
      return null;
    }

    // Check if the file exists
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        search: fileName
      });

    if (error) {
      console.error('Error checking file existence:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn(`File ${fileName} not found in bucket ${bucketName}`);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // Add cache-busting parameter to the URL
    const cacheBustUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Verify the URL is valid by making a HEAD request
    try {
      const response = await fetch(cacheBustUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.warn(`URL verification failed for ${fileName}: ${response.status} ${response.statusText}`);
        return null;
      }
      console.log(`URL verified for ${fileName}: ${cacheBustUrl}`);
      return cacheBustUrl;
    } catch (fetchError) {
      console.error(`Error verifying URL for ${fileName}:`, fetchError);
      return null;
    }
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
};

/**
 * Checks and fixes bucket permissions
 * @param bucketName The name of the bucket
 * @returns A boolean indicating if the bucket is properly configured
 */
export const checkAndFixBucketPermissions = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Checking permissions for bucket: ${bucketName}`);

    // First check if the bucket exists
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) {
      console.warn(`Bucket ${bucketName} does not exist. Please create it in the Supabase dashboard.`);
      return false;
    }

    // Try to upload a small test file to verify permissions
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload('test.txt', testFile, {
        upsert: true
      });

    if (uploadError) {
      console.error(`Error uploading test file to bucket ${bucketName}:`, uploadError);
      console.warn('Bucket permissions may be incorrect. Please check the Supabase dashboard.');
      return false;
    }

    // Try to get the public URL of the test file
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl('test.txt');

    // Try to fetch the test file
    try {
      const response = await fetch(urlData.publicUrl);
      if (!response.ok) {
        console.warn(`Cannot access files in bucket ${bucketName}. Public access may be disabled.`);
        console.warn('Please enable public access in the Supabase dashboard:');
        console.warn('1. Go to Storage > Buckets');
        console.warn('2. Select the bucket');
        console.warn('3. Click on "Policies"');
        console.warn('4. Add a policy for public access');
        return false;
      }

      // Clean up the test file
      await supabase.storage
        .from(bucketName)
        .remove(['test.txt']);

      console.log(`Bucket ${bucketName} permissions are correctly configured.`);
      return true;
    } catch (fetchError) {
      console.error(`Error fetching test file from bucket ${bucketName}:`, fetchError);
      return false;
    }
  } catch (error) {
    console.error('Error checking bucket permissions:', error);
    return false;
  }
};

export const uploadProfilePicture = async (file: File, employeeId: string): Promise<string | null> => {
  try {
    console.log(`Starting profile picture upload for employee ${employeeId}`);
    console.log(`File details: name=${file.name}, size=${file.size}bytes, type=${file.type}`);

    // Use the uploadImage function with the employee_pictures bucket
    const uploadedUrl = await uploadImage(file, 'employee_pictures');

    if (uploadedUrl) {
      console.log(`Profile picture uploaded successfully. URL: ${uploadedUrl}`);
      return uploadedUrl;
    } else {
      console.error('Failed to upload profile picture');
      return null;
    }
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    alert(`An unexpected error occurred during image upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

export const getDefaultAvatarUrl = (firstName?: string, lastName?: string): string => {
  // Return a default avatar image from the public folder
  // We're not using firstName and lastName here, but they're kept for compatibility
  // with code that might be calling this function with those parameters
  console.log(`Getting default avatar for ${firstName || ''} ${lastName || ''}`);
  return '/default-avatar.png';
};