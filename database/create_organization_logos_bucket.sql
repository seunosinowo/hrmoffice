-- Create the storage bucket for organization logos
-- (This must be done in the Supabase dashboard UI, but this is a reminder)
-- Bucket name: organization-logos

-- Policy: Allow anyone to upload during sign-up (can be restricted later)
CREATE POLICY "Allow upload for anyone"
ON storage.objects
FOR INSERT
TO public
USING (bucket_id = 'organization-logos'); 