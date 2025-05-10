import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { checkBucketExists, checkAndFixBucketPermissions } from '../utils/imageUpload';

const BucketDiagnostic: React.FC = () => {
  const [bucketStatus, setBucketStatus] = useState<{
    exists: boolean;
    permissionsOk: boolean;
    message: string;
  }>({
    exists: false,
    permissionsOk: false,
    message: 'Checking bucket status...'
  });
  const [loading, setLoading] = useState(true);
  const [testUploadResult, setTestUploadResult] = useState<string | null>(null);
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkBucket = async () => {
      try {
        setLoading(true);

        // Check if the profile_pictures bucket exists
        const exists = await checkBucketExists('profile_pictures');

        if (!exists) {
          setBucketStatus({
            exists: false,
            permissionsOk: false,
            message: 'The profile_pictures bucket does not exist. Please create it in the Supabase dashboard.'
          });
          setLoading(false);
          return;
        }

        // Check bucket permissions
        const permissionsOk = await checkAndFixBucketPermissions('profile_pictures');

        setBucketStatus({
          exists: true,
          permissionsOk,
          message: permissionsOk
            ? 'The profile_pictures bucket exists and has correct permissions.'
            : 'The profile_pictures bucket exists but has incorrect permissions.'
        });
      } catch (error) {
        console.error('Error checking bucket:', error);
        setBucketStatus({
          exists: false,
          permissionsOk: false,
          message: `Error checking bucket: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setLoading(false);
      }
    };

    checkBucket();
  }, []);

  const handleTestUpload = async () => {
    try {
      setLoading(true);
      setTestUploadResult(null);
      setTestImageUrl(null);

      // Create a small test image (1x1 pixel transparent PNG)
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const byteString = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const intArray = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([arrayBuffer], { type: 'image/png' });
      const testFile = new File([blob], 'test-image.png', { type: 'image/png' });

      // Upload the test file
      const fileName = `test-${Date.now()}.png`;
      const { error } = await supabase.storage
        .from('profile_pictures')
        .upload(fileName, testFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        setTestUploadResult(`Upload failed: ${error.message}`);
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(fileName);

      // Add cache-busting parameter
      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setTestImageUrl(imageUrl);
      setTestUploadResult('Upload successful! Image should appear below.');

    } catch (error) {
      console.error('Error in test upload:', error);
      setTestUploadResult(`Test upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Supabase Storage Bucket Diagnostic</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Bucket Status</h2>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Checking...</span>
          </div>
        ) : (
          <div>
            <div className={`p-4 mb-4 rounded-lg ${bucketStatus.exists && bucketStatus.permissionsOk ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'}`}>
              <p className="font-medium">{bucketStatus.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">Bucket Exists</h3>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bucketStatus.exists ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                  {bucketStatus.exists ? 'Yes' : 'No'}
                </div>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">Permissions Configured</h3>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bucketStatus.permissionsOk ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                  {bucketStatus.permissionsOk ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            <button
              onClick={handleTestUpload}
              disabled={!bucketStatus.exists || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Upload
            </button>
          </div>
        )}
      </div>

      {testUploadResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Upload Result</h2>
          <div className={`p-4 mb-4 rounded-lg ${testUploadResult.includes('successful') ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
            <p>{testUploadResult}</p>
          </div>

          {testImageUrl && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Test Image:</h3>
              <div className="border dark:border-gray-700 rounded-lg p-4 flex items-center justify-center">
                <img
                  src={testImageUrl}
                  alt="Test upload"
                  className="max-w-full h-auto"
                  onError={() => setTestUploadResult('Image failed to load. The URL might be correct but the image is not publicly accessible.')}
                  crossOrigin="anonymous"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">URL: {testImageUrl}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">If the bucket doesn't exist:</h3>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Go to your Supabase dashboard</li>
              <li>Navigate to Storage</li>
              <li>Click "New Bucket"</li>
              <li>Name it "profile_pictures"</li>
              <li>Make sure "Public bucket" is checked</li>
              <li>Click "Create bucket"</li>
            </ol>
          </div>

          <div>
            <h3 className="font-medium">If permissions are incorrect:</h3>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Go to your Supabase dashboard</li>
              <li>Navigate to Storage</li>
              <li>Select the "profile_pictures" bucket</li>
              <li>Click on "Policies" tab</li>
              <li>Add policies for INSERT, SELECT, UPDATE, and DELETE operations</li>
              <li>For a simple setup, you can use the policy: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">true</code> for all operations</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BucketDiagnostic;
