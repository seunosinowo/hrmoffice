import { supabase } from '../lib/supabase';

/**
 * Checks if a bucket exists in Supabase storage
 * @param bucketName The name of the bucket to check
 * @returns A boolean indicating if the bucket exists
 */
export const checkBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Checking if bucket "${bucketName}" exists...`);

    // First try to list buckets to see all available buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      // If we can't list buckets, try to list files in the specific bucket
      const { error } = await supabase.storage.from(bucketName).list();
      if (error) {
        console.error(`Error listing files in bucket "${bucketName}":`, error);
        return false;
      }
      console.log(`Successfully listed files in bucket "${bucketName}"`);
      return true;
    }

    // Log all available buckets
    if (buckets && buckets.length > 0) {
      console.log('Available buckets:', buckets.map(b => b.name).join(', '));

      // Check if our bucket exists
      const bucketExists = buckets.some(b => b.name === bucketName);
      console.log(`Bucket "${bucketName}" exists: ${bucketExists}`);

      return bucketExists;
    } else {
      console.log('No buckets found in Supabase');
      return false;
    }
  } catch (error) {
    console.error('Error checking bucket existence:', error);
    return false;
  }
};

/**
 * Creates a bucket in Supabase storage
 * @param bucketName The name of the bucket to create
 * @returns A boolean indicating if the bucket was created successfully
 */
export const createBucket = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Attempting to create bucket "${bucketName}"...`);

    // Check if bucket already exists
    const bucketExists = await checkBucketExists(bucketName);
    if (bucketExists) {
      console.log(`Bucket "${bucketName}" already exists.`);
      return true;
    }

    // Create the bucket
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true
    });

    if (error) {
      console.error(`Error creating bucket "${bucketName}":`, error);
      return false;
    }

    console.log(`Successfully created bucket "${bucketName}"`);
    return true;
  } catch (error) {
    console.error('Error creating bucket:', error);
    return false;
  }
};

/**
 * Sets up RLS policies for a bucket
 * @param bucketName The name of the bucket to set up policies for
 * @returns A boolean indicating if the policies were set up successfully
 */
export const setupBucketPolicies = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Setting up policies for bucket "${bucketName}"...`);

    // This is a placeholder function since we can't directly set up RLS policies
    // through the JavaScript client. You would typically do this through the Supabase dashboard.

    console.log(`Please set up the following policies for bucket "${bucketName}" in the Supabase dashboard:`);
    console.log('1. SELECT policy: Allow public access to view files');
    console.log('2. INSERT policy: Allow authenticated users to upload files');
    console.log('3. UPDATE policy: Allow authenticated users to update their files');
    console.log('4. DELETE policy: Allow authenticated users to delete their files');

    return true;
  } catch (error) {
    console.error('Error setting up bucket policies:', error);
    return false;
  }
};

/**
 * Tests uploading a file to a bucket
 * @param bucketName The name of the bucket to upload to
 * @returns A boolean indicating if the upload was successful
 */
export const testBucketUpload = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Testing upload to bucket "${bucketName}"...`);

    // Create a small test file
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

    // Upload the test file
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`test_${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`Error uploading test file to bucket "${bucketName}":`, error);
      return false;
    }

    console.log(`Successfully uploaded test file to bucket "${bucketName}"`);
    return true;
  } catch (error) {
    console.error('Error testing bucket upload:', error);
    return false;
  }
};

/**
 * Diagnoses and fixes issues with a storage bucket
 * @param bucketName The name of the bucket to diagnose
 * @returns A string with the diagnosis results
 */
export const diagnoseBucket = async (bucketName: string): Promise<string> => {
  try {
    console.log(`Starting diagnosis for bucket "${bucketName}"...`);

    // Step 1: Check if bucket exists
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) {
      // Try to create the bucket
      const created = await createBucket(bucketName);
      if (!created) {
        return `Bucket "${bucketName}" does not exist and could not be created. Please create it manually in the Supabase dashboard.`;
      }
    }

    // Step 2: Test uploading a file
    const uploadSuccessful = await testBucketUpload(bucketName);
    if (!uploadSuccessful) {
      // Suggest setting up policies
      await setupBucketPolicies(bucketName);
      return `Bucket "${bucketName}" exists but upload failed. Please check the bucket policies in the Supabase dashboard.`;
    }

    return `Bucket "${bucketName}" exists and is working correctly.`;
  } catch (error) {
    console.error('Error diagnosing bucket:', error);
    return `Error diagnosing bucket "${bucketName}": ${error instanceof Error ? error.message : String(error)}`;
  }
};
