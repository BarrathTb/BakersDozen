# Fixing Row Level Security (RLS) Policies in Supabase

You're encountering an error when trying to sign up: "new row violates row-level security policy for table 'users'". This is because the Row Level Security policies in Supabase are preventing new users from creating their profile in the `users` table.

Follow these steps to fix the issue:

## 1. Go to the Supabase Dashboard

Open your Supabase project dashboard at: https://app.supabase.com/project/oymphribxstjogphnean

## 2. Open the SQL Editor

Click on "SQL Editor" in the left sidebar.

## 3. Create a New Query

Click on "New Query" and paste the following SQL:

```sql
-- First, check if RLS is enabled for the users table
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- Enable RLS for the users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for the users table
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can create users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

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
```

## 4. Run the Query

Click the "Run" button to execute the SQL. This will:

1. Enable Row Level Security on the `users` table
2. Drop any existing policies
3. Create new policies that:
   - Allow anyone to view all users
   - Allow users to update their own profile
   - Allow authenticated users to insert their own profile during signup
   - Allow admins to create other users
   - Allow only admins to delete users

## 5. Verify the Policies

The last command in the SQL will show you all the policies that are now applied to the `users` table. Make sure you see the policies listed above.

## 6. Test Signup Again

After applying these changes, try signing up again in your application. The error should be resolved, and new users should be able to create their profiles successfully.

## Additional Information

If you're still encountering issues, you might need to check:

1. The structure of your `users` table to ensure it matches what your application expects
2. The authentication settings in your Supabase project
3. Any triggers or functions that might be affecting the insert operation

You can also try enabling more detailed logging in Supabase to see exactly what's happening when a new user tries to sign up.
