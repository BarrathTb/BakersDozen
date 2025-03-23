-- Fix Row Level Security policies for the users table

-- First, check if RLS is enabled for the users table
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- Enable RLS for the users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the users table
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can create users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;

-- Create policies for the users table
-- 1. Allow anyone to view all users
CREATE POLICY "Users can view all users" 
ON users FOR SELECT 
USING (true);

-- 2. Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- 3. Allow authenticated users to insert their own profile during signup
CREATE POLICY "Allow authenticated users to insert" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Allow admins to create other users
CREATE POLICY "Only admins can create other users" 
ON users FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ) OR auth.uid() = id
);

-- 5. Only admins can delete users
CREATE POLICY "Only admins can delete users" 
ON users FOR DELETE 
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'users';