# Deployment Instructions for HRM Office

Follow these steps to fix the CORS issues and ensure proper deployment on Vercel:

## 1. Configure Supabase CORS Settings

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project "emkueibcxdhhiqlloron"
3. Go to Project Settings (gear icon in the left sidebar)
4. Select "API" from the settings menu
5. Scroll down to the "CORS" section
6. Add the following URLs to the "Additional allowed origins" section:
   - `https://hrmoffice.vercel.app`
   - `https://www.hrmoffice.vercel.app`
7. Click "Save" to apply the changes

## 2. Fix Supabase RLS Policies

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of the `database/fix_rls_policies.sql` file
3. Run the SQL queries to fix the RLS policies
4. Repeat the same process with the `database/fix_database_queries.sql` file

## 3. Configure Vercel Environment Variables

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

## 4. Redeploy Your Application

1. Go to the "Deployments" tab in your Vercel dashboard
2. Click "Redeploy" on your latest deployment
3. Wait for the deployment to complete
4. Test your application to ensure the CORS issues are resolved

## 5. Verify Role Management

1. Log in to your application
2. Check that users only have one role assigned
3. Verify that the role hierarchy is working correctly (HR > Assessor > Employee)
4. Test upgrading a user's role to ensure it works properly

If you continue to experience issues, check the browser console for error messages and review the Supabase logs for any database errors.
