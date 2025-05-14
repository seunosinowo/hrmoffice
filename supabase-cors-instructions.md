# Supabase CORS Configuration Instructions

Follow these steps to configure CORS in your Supabase project:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project "emkueibcxdhhiqlloron"
3. Go to Project Settings (gear icon in the left sidebar)
4. Select "API" from the settings menu
5. Scroll down to the "CORS" section
6. Add the following URLs to the "Additional allowed origins" section:
   - `https://hrmoffice.vercel.app`
   - `https://www.hrmoffice.vercel.app`
7. Click "Save" to apply the changes

This will allow your Vercel deployment to make requests to your Supabase backend.
