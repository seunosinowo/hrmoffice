-- SQL script to fix Row Level Security (RLS) policies for competency_proficiencies table

-- First, check if RLS is enabled for the table
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'competency_proficiencies';

-- 1. Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable read access for all users" ON "competency_proficiencies";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "competency_proficiencies";
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON "competency_proficiencies";
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON "competency_proficiencies";
DROP POLICY IF EXISTS "Allow all operations for HR and assessor roles" ON "competency_proficiencies";
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON "competency_proficiencies";

-- 2. Create a simple policy that allows all authenticated users to perform all operations
-- This is the simplest solution and should work for all roles

CREATE POLICY "Allow all operations for authenticated users" 
ON "competency_proficiencies"
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Make sure RLS is enabled for the table
ALTER TABLE "competency_proficiencies" ENABLE ROW LEVEL SECURITY;
