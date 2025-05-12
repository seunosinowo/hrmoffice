# Supabase Setup Guide

This guide will help you set up Supabase for your HR Management application and access the database tables.

## 1. Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one
2. Create a new project:
   - Click "New Project"
   - Enter a name for your project (e.g., "HRM Office")
   - Set a secure database password
   - Choose a region closest to your users
   - Click "Create new project"

## 2. Set Up Database Schema

1. Once your project is created, go to the SQL Editor in the Supabase dashboard
2. Create a new query
3. Copy and paste the entire content of the `supabase_schema.sql` file
4. Run the query to create all tables and set up security policies

## 3. Configure Storage for Profile Pictures

1. Go to the Storage section in the Supabase dashboard
2. Create a new bucket called `employee_pictures`
3. Set the bucket's privacy settings to "Public"
4. Set up CORS (Cross-Origin Resource Sharing):
   - Go to the Storage settings
   - Add `*` to the allowed origins (or your specific domain for production)

## 4. Connect Your Application to Supabase

1. Go to Project Settings > API
2. Copy the URL and anon key
3. Create a `.env.local` file in your project root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Restart your development server

## 5. Accessing and Viewing Tables

### Through Supabase Dashboard

1. Go to the Table Editor in the Supabase dashboard
2. You'll see all your tables listed on the left
3. Click on any table to view, edit, or delete records
4. You can also run custom SQL queries in the SQL Editor

### Through Your Application

The application is already set up to interact with these tables through the Supabase client. The main tables are:

- `users` (Supabase Auth Users)
- `roles` (Employee, Assessor, HR)
- `user_role_assignments` (Links users to roles)
- `employees` (Employee profiles)
- `departments` (Department information)
- `employee_departments` (Links employees to departments)
- `employee_assessments` (Assessment records)

## 6. Testing the Database

1. Create a test user through your application's signup process
2. Check the `auth.users` table in Supabase to confirm the user was created
3. Create an employee profile for that user
4. Check the `employees` table to confirm the profile was created
5. Try adding departments and linking them to employees

## 7. Troubleshooting

### Profile Pictures Not Showing

If profile pictures aren't displaying:

1. Check the Storage section in Supabase to ensure the images were uploaded
2. Verify the bucket permissions are set to "Public"
3. Check the browser console for any CORS errors
4. Make sure the image URLs in the database are correct

### Database Errors

If you encounter database errors:

1. Check the browser console for specific error messages
2. Verify your Supabase URL and anon key are correct
3. Check the Row Level Security (RLS) policies to ensure they're not blocking operations
4. Use the Supabase dashboard to run test queries directly

## 8. Managing User Roles

To assign roles to users:

1. Go to the `user_role_assignments` table
2. Add a new record with the user's ID and the appropriate role ID
3. Or use the HR interface in your application to manage roles

Remember that by default, all new users are assigned the "employee" role through the trigger we set up in the schema.
