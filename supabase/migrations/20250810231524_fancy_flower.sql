/*
  # Fix anonymous access to all tables

  1. Changes
    - Drop all existing RLS policies
    - Create permissive policies for anonymous users
    - Grant all permissions to anon role

  2. Security
    - Allow anonymous users full access to all tables
    - This is necessary for the application to function properly
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON vehicles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON tolls;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON tolls;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON invoices;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON invoices;

-- Ensure RLS is enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create new permissive policies for anonymous users
CREATE POLICY "vehicles_anon_policy" ON vehicles
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tolls_anon_policy" ON tolls
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "invoices_anon_policy" ON invoices
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create policies for authenticated users as well
CREATE POLICY "vehicles_auth_policy" ON vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tolls_auth_policy" ON tolls
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "invoices_auth_policy" ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant all permissions to anon role
GRANT ALL PRIVILEGES ON vehicles TO anon;
GRANT ALL PRIVILEGES ON tolls TO anon;
GRANT ALL PRIVILEGES ON invoices TO anon;

-- Grant all permissions to authenticated role
GRANT ALL PRIVILEGES ON vehicles TO authenticated;
GRANT ALL PRIVILEGES ON tolls TO authenticated;
GRANT ALL PRIVILEGES ON invoices TO authenticated;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;