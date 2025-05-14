# Vercel Environment Variables Configuration

Follow these steps to ensure your environment variables are correctly set in Vercel:

1. Log in to your Vercel dashboard at https://vercel.com/
2. Select your "hrmoffice" project
3. Go to "Settings" tab
4. Select "Environment Variables" from the left sidebar
5. Verify that the following environment variables are set:
   - `VITE_SUPABASE_URL` = `https://emkueibcxdhhiqlloron.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key (check your local .env file)
6. If any of these variables are missing or incorrect, add or update them
7. Make sure to set them for all environments (Production, Preview, and Development)
8. Click "Save" to apply the changes
9. Redeploy your application by going to the "Deployments" tab and clicking "Redeploy"

This will ensure your Vercel deployment has the correct environment variables to connect to Supabase.
