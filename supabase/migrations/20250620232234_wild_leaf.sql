/*
  # Fix vehicle registration issues

  1. Changes
    - Ensure tables exist with correct structure
    - Fix RLS policies to allow anonymous access
    - Grant necessary permissions

  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous users to perform all operations
*/

-- Ensure tables exist with correct structure
CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  number text NOT NULL,
  drivername text NOT NULL,
  licenseplate text NOT NULL
);

CREATE TABLE IF NOT EXISTS tolls (
  id text PRIMARY KEY,
  highway text NOT NULL,
  licenseplate text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  highway text NOT NULL,
  agreementnumber text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL,
  billingdate text NOT NULL
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies for vehicles table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vehicles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON vehicles';
    END LOOP;
    
    -- Drop all policies for tolls table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tolls' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON tolls';
    END LOOP;
    
    -- Drop all policies for invoices table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'invoices' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON invoices';
    END LOOP;
END $$;

-- Create comprehensive policies for anonymous users
CREATE POLICY "Allow all operations for anonymous users" ON vehicles
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON tolls
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON invoices
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Also create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON tolls
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT ALL ON vehicles TO anon;
GRANT ALL ON tolls TO anon;
GRANT ALL ON invoices TO anon;

-- Grant necessary permissions to authenticated role
GRANT ALL ON vehicles TO authenticated;
GRANT ALL ON tolls TO authenticated;
GRANT ALL ON invoices TO authenticated;