import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../utils/imageUpload';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

interface ImageStatus {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
}

const ProfilePictureDiagnostic: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [imageStatuses, setImageStatuses] = useState<Record<string, ImageStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, profile_picture_url')
        .order('first_name');

      if (error) throw error;

      setEmployees(data || []);
      
      // Check image URLs
      const statuses: Record<string, ImageStatus> = {};
      for (const emp of data || []) {
        if (emp.profile_picture_url) {
          try {
            // Add cache-busting parameter for verification
            const cacheBustUrl = `${emp.profile_picture_url.split('?')[0]}?t=${Date.now()}`;
            console.log(`Checking image URL for ${emp.first_name} ${emp.last_name}: ${cacheBustUrl}`);
            
            const response = await fetch(cacheBustUrl, { 
              method: 'HEAD',
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            });
            
            statuses[emp.id] = {
              url: emp.profile_picture_url,
              status: response.status,
              ok: response.ok
            };
            
            console.log(`Image status for ${emp.first_name} ${emp.last_name}: ${response.status} ${response.ok ? 'OK' : 'Not OK'}`);
          } catch (fetchError) {
            console.error(`Error checking image for ${emp.first_name} ${emp.last_name}:`, fetchError);
            statuses[emp.id] = {
              url: emp.profile_picture_url,
              status: 0,
              ok: false,
              error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            };
          }
        }
      }
      
      setImageStatuses(statuses);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTestFile(file);
    }
  };

  const handleUploadTest = async () => {
    if (!selectedEmployee || !testFile) return;
    
    try {
      setLoading(true);
      setUploadResult(null);
      setUploadedUrl(null);
      
      console.log(`Starting test upload for employee ${selectedEmployee.id}`);
      const url = await uploadImage(testFile, 'profile_pictures');
      
      if (!url) {
        setUploadResult('Upload failed. Check console for details.');
        return;
      }
      
      setUploadedUrl(url);
      setUploadResult('Upload successful! Now updating employee record...');
      
      // Update the employee record with the new URL
      const { error: updateError } = await supabase
        .from('employees')
        .update({ profile_picture_url: url })
        .eq('id', selectedEmployee.id);
      
      if (updateError) {
        setUploadResult(`Upload successful but failed to update employee record: ${updateError.message}`);
        return;
      }
      
      setUploadResult('Upload successful and employee record updated!');
      
      // Refresh the employee list
      await fetchEmployees();
    } catch (err) {
      console.error('Error in test upload:', err);
      setUploadResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fixImageUrl = async (employeeId: string) => {
    try {
      setLoading(true);
      
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee || !employee.profile_picture_url) {
        setError('Employee not found or has no profile picture URL');
        return;
      }
      
      // Remove any query parameters from the URL
      const cleanUrl = employee.profile_picture_url.split('?')[0];
      console.log(`Fixing image URL for ${employee.first_name} ${employee.last_name}`);
      console.log(`Original URL: ${employee.profile_picture_url}`);
      console.log(`Clean URL: ${cleanUrl}`);
      
      // Update the employee record with the clean URL
      const { error: updateError } = await supabase
        .from('employees')
        .update({ profile_picture_url: cleanUrl })
        .eq('id', employeeId);
      
      if (updateError) {
        setError(`Failed to update employee record: ${updateError.message}`);
        return;
      }
      
      // Refresh the employee list
      await fetchEmployees();
    } catch (err) {
      console.error('Error fixing image URL:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Profile Picture Diagnostic</h1>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Employee Profile Pictures</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {employees.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No employees found.</p>
            ) : (
              employees.map(employee => (
                <div key={employee.id} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="relative w-16 h-16 mr-4">
                      {employee.profile_picture_url ? (
                        <img
                          src={`${employee.profile_picture_url.split('?')[0]}?t=${Date.now()}`}
                          alt={`${employee.first_name} ${employee.last_name}`}
                          className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Error loading image:', employee.profile_picture_url);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                          <span className="text-lg font-semibold text-gray-400">
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{employee.first_name} {employee.last_name}</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {employee.profile_picture_url ? (
                          <div>
                            <div className="flex items-center">
                              <span className="mr-2">Status:</span>
                              {imageStatuses[employee.id] ? (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${imageStatuses[employee.id].ok ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                                  {imageStatuses[employee.id].ok ? 'Accessible' : `Not Accessible (${imageStatuses[employee.id].status})`}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                  Checking...
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs truncate max-w-md">
                              URL: {employee.profile_picture_url}
                            </div>
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() => fixImageUrl(employee.id)}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Fix URL
                              </button>
                              <button
                                onClick={() => setSelectedEmployee(employee)}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Replace Image
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                              No Profile Picture
                            </span>
                            <div className="mt-2">
                              <button
                                onClick={() => setSelectedEmployee(employee)}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Add Image
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {selectedEmployee && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedEmployee.profile_picture_url ? 'Replace' : 'Add'} Profile Picture for {selectedEmployee.first_name} {selectedEmployee.last_name}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Image
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <button
              onClick={handleUploadTest}
              disabled={!testFile || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Upload Image'}
            </button>
            
            {uploadResult && (
              <div className={`p-4 rounded-lg ${uploadResult.includes('successful') ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
                <p>{uploadResult}</p>
              </div>
            )}
            
            {uploadedUrl && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Uploaded Image:</h3>
                <div className="border dark:border-gray-700 rounded-lg p-4 flex items-center justify-center">
                  <img 
                    src={`${uploadedUrl}?t=${Date.now()}`}
                    alt="Uploaded image" 
                    className="max-w-full h-auto max-h-64"
                    crossOrigin="anonymous"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">URL: {uploadedUrl}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureDiagnostic;
