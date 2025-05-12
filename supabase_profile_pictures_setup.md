# Setting Up the 'profile_pictures' Bucket in Supabase

This guide will help you set up the 'profile_pictures' bucket in Supabase for storing employee profile pictures.

## 1. Create the Bucket

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Navigate to the "Storage" section in the left sidebar
4. Click on "New Bucket"
5. Enter the bucket name: `profile_pictures` (make sure to use exactly this name)
6. Check the "Public" option to make the bucket publicly accessible
7. Click "Create bucket"

## 2. Set Up Access Policies

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

## 3. Configure CORS Settings (Optional)

If you're experiencing CORS issues:

1. In the Storage section, click on "Policies" in the top navigation
2. Click on "CORS Configurations" tab
3. Add a new CORS configuration with the following settings:
   - Allowed Origins: `*` (or your specific domain for production)
   - Allowed Methods: `GET, POST, PUT, DELETE, OPTIONS`
   - Allowed Headers: `*`
   - Max Age: `86400` (24 hours)
4. Click "Save"

## 4. Test the Bucket

After setting up the bucket and policies, you should test it:

1. Go back to your application
2. Try uploading a profile picture in the Employee Details component
3. Check if the image uploads successfully and displays correctly

## Troubleshooting

If you're still experiencing issues:

1. **Authentication Issues**: Make sure the user is properly authenticated when uploading files
2. **Policy Issues**: Double-check that all four policies (SELECT, INSERT, UPDATE, DELETE) are correctly set up
3. **Browser Console**: Check the browser console for detailed error messages
4. **Network Tab**: In the browser's developer tools, check the Network tab for the specific request that's failing

## SQL Script for Setting Up the Bucket (Alternative Method)

If you prefer using SQL, you can run the following script in the Supabase SQL Editor:

```sql
-- Create the profile_pictures bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'profile_pictures', 'profile_pictures', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'profile_pictures'
);

-- Create policies using the storage API
SELECT storage.create_policy(
    'profile_pictures',
    'SELECT',
    'Allow public access to profile pictures',
    true
);

SELECT storage.create_policy(
    'profile_pictures',
    'INSERT',
    'Allow authenticated users to upload profile pictures',
    'auth.role() = ''authenticated'''
);

SELECT storage.create_policy(
    'profile_pictures',
    'UPDATE',
    'Allow authenticated users to update profile pictures',
    'auth.role() = ''authenticated'''
);

SELECT storage.create_policy(
    'profile_pictures',
    'DELETE',
    'Allow authenticated users to delete profile pictures',
    'auth.role() = ''authenticated'''
);
```

Note: The SQL script might need adjustments based on your specific Supabase version.
