-- Comprehensive RLS Policy Fix for All Tables
-- Run this in the Supabase SQL Editor to fix RLS policies for all tables

-- Create helper function to enable RLS and create policies
CREATE OR REPLACE FUNCTION setup_rls_for_table(table_name text) RETURNS void AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "Allow select for %1$I" ON %1$I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow insert for %1$I" ON %1$I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow update for %1$I" ON %1$I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow delete for %1$I" ON %1$I', table_name);
    
    -- Create SELECT policy (allow all authenticated users to select)
    EXECUTE format('CREATE POLICY "Allow select for %1$I" ON %1$I FOR SELECT USING (true)', table_name);
    
    -- Create INSERT policy (allow authenticated users to insert)
    EXECUTE format('CREATE POLICY "Allow insert for %1$I" ON %1$I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)', table_name);
    
    -- Create UPDATE policy (allow authenticated users to update)
    EXECUTE format('CREATE POLICY "Allow update for %1$I" ON %1$I FOR UPDATE USING (auth.uid() IS NOT NULL)', table_name);
    
    -- Create DELETE policy (allow authenticated users to delete)
    EXECUTE format('CREATE POLICY "Allow delete for %1$I" ON %1$I FOR DELETE USING (auth.uid() IS NOT NULL)', table_name);
END;
$$ LANGUAGE plpgsql;

-- Special handling for users table
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can create users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow select for users" ON users;
DROP POLICY IF EXISTS "Allow insert for users" ON users;
DROP POLICY IF EXISTS "Allow update for users" ON users;
DROP POLICY IF EXISTS "Allow delete for users" ON users;

-- Create policies for the users table
-- 1. Allow anyone to view all users
CREATE POLICY "Allow select for users" 
ON users FOR SELECT 
USING (true);

-- 2. Allow users to update their own profile
CREATE POLICY "Allow update for users" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- 3. Allow authenticated users to insert their own profile during signup
CREATE POLICY "Allow insert for users" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Only admins can delete users
CREATE POLICY "Allow delete for users" 
ON users FOR DELETE 
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Set up RLS for all other tables
SELECT setup_rls_for_table('ingredients');
SELECT setup_rls_for_table('recipes');
SELECT setup_rls_for_table('recipe_ingredients');
SELECT setup_rls_for_table('bakes');
SELECT setup_rls_for_table('deliveries');
SELECT setup_rls_for_table('delivery_items');
SELECT setup_rls_for_table('removals');
SELECT setup_rls_for_table('removal_items');

-- Verify policies for all tables
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Drop the helper function
DROP FUNCTION setup_rls_for_table(text);