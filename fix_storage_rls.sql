-- FIX STORAGE RLS POLICIES
-- This query will properly set up RLS policies for the employee_pictures bucket

-- First, check if the bucket exists
SELECT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'employee_pictures'
) AS bucket_exists;

-- Check current RLS policies for the objects table (this is where the actual files are stored)
SELECT
  policy_name,
  definition,
  action
FROM
  pg_policies
WHERE
  tablename = 'objects' AND schemaname = 'storage';

-- Enable RLS on the objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the employee_pictures bucket to avoid conflicts
DO $$
BEGIN
  -- Try to drop policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Allow public read access for employee_pictures" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Allow authenticated insert access for employee_pictures" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Allow authenticated update access for employee_pictures" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Allow authenticated delete access for employee_pictures" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Create policy for public read access (anyone can view images)
CREATE POLICY "Allow public read access for employee_pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'employee_pictures');

-- Create policy for authenticated uploads (any authenticated user can upload)
CREATE POLICY "Allow authenticated insert access for employee_pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee_pictures');

-- Create policy for authenticated updates (any authenticated user can update)
CREATE POLICY "Allow authenticated update access for employee_pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'employee_pictures')
WITH CHECK (bucket_id = 'employee_pictures');

-- Create policy for authenticated deletes (any authenticated user can delete)
CREATE POLICY "Allow authenticated delete access for employee_pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'employee_pictures');

-- Verify the policies were created
SELECT
  policy_name,
  definition,
  action
FROM
  pg_policies
WHERE
  tablename = 'objects' AND schemaname = 'storage'
  AND policy_name LIKE '%employee_pictures%';

-- Make sure the bucket is set to public
UPDATE storage.buckets
SET public = true
WHERE name = 'employee_pictures';

-- Check if the bucket is public
SELECT name, public FROM storage.buckets WHERE name = 'employee_pictures';
