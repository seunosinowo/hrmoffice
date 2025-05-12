# Administrator Guide: Setting Up the 'profile_pictures' Bucket in Supabase

This guide is for administrators who need to set up the 'profile_pictures' bucket in Supabase for storing employee profile pictures.

## Step 1: Create the Bucket

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Navigate to the "Storage" section in the left sidebar
4. Click on "New Bucket"
5. Enter the bucket name: `profile_pictures` (make sure to use exactly this name)
6. Check the "Public" option to make the bucket publicly accessible
7. Click "Create bucket"

## Step 2: Set Up Access Policies

After creating the bucket, you need to set up access policies to allow users to upload and view images:

1. In the Storage section, click on the "Policies" tab
2. Click on the `profile_pictures` bucket
3. Add the following policies:

### For SELECT operations (viewing images)
1. Click "Add Policy"
2. Policy name: `Allow public access to profile pictures`
3. Allowed operation: `SELECT`
4. Policy definition: `true` (allows anyone to view the images)
5. Click "Save policy"

### For INSERT operations (uploading images)
1. Click "Add Policy"
2. Policy name: `Allow authenticated users to upload profile pictures`
3. Allowed operation: `INSERT`
4. Policy definition: `auth.role() = 'authenticated'`
5. Click "Save policy"

### For UPDATE operations (modifying images)
1. Click "Add Policy"
2. Policy name: `Allow authenticated users to update profile pictures`
3. Allowed operation: `UPDATE`
4. Policy definition: `auth.role() = 'authenticated'`
5. Click "Save policy"

### For DELETE operations (removing images)
1. Click "Add Policy"
2. Policy name: `Allow authenticated users to delete profile pictures`
3. Allowed operation: `DELETE`
4. Policy definition: `auth.role() = 'authenticated'`
5. Click "Save policy"

## Step 3: Verify the Setup

After setting up the bucket and policies, you should verify that everything is working correctly:

1. In the Storage section, click on the "Buckets" tab
2. Click on the `profile_pictures` bucket
3. Click "Upload File" and select a test image
4. The upload should succeed if the policies are set up correctly
5. Click on the uploaded file to view its details
6. Copy the URL and paste it in a browser to verify it's publicly accessible

## Troubleshooting

If users are still experiencing issues uploading images:

1. **Check Authentication**: Make sure users are properly authenticated when uploading files
2. **Check Policy Definitions**: Verify that the policy definitions are correct
3. **Check CORS Settings**: If users are experiencing CORS issues, configure CORS settings:
   - In the Storage section, click on "Policies" in the top navigation
   - Click on "CORS Configurations" tab
   - Add a new CORS configuration with the following settings:
     - Allowed Origins: `*` (or your specific domain for production)
     - Allowed Methods: `GET, POST, PUT, DELETE, OPTIONS`
     - Allowed Headers: `*`
     - Max Age: `86400` (24 hours)
   - Click "Save"

## Important Notes

- Only administrators can create buckets in Supabase
- Regular users cannot create buckets, even if they are authenticated
- The bucket name must be exactly `profile_pictures` to match the code
- All four policies (SELECT, INSERT, UPDATE, DELETE) are required for full functionality
