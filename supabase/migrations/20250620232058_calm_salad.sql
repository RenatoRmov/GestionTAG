/*
  # Fix database tables structure and policies

  1. Changes
    - Ensure tables exist with correct column names
    - Drop existing restrictive policies
    - Set up proper public access policies
    - Avoid dropping tables to prevent data loss

  2. Security
    - Enable RLS on all tables
    - Add policies for public access to allow anonymous users
*/

-- Create tables if they don't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS vehicles (
    id text PRIMARY KEY,
    number text NOT NULL,
    drivername text NOT NULL,
    licenseplate text NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS tolls (
    id text PRIMARY KEY,
    highway text NOT NULL,
    licenseplate text NOT NULL,
    amount numeric NOT NULL,
    month text NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS invoices (
    id text PRIMARY KEY,
    highway text NOT NULL,
    agreementnumber text NOT NULL,
    amount numeric NOT NULL,
    month text NOT NULL,
    billingdate text NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public access" ON vehicles;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Users can read own data" ON vehicles;

DROP POLICY IF EXISTS "Public access" ON tolls;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON tolls;
DROP POLICY IF EXISTS "Users can read own data" ON tolls;

DROP POLICY IF EXISTS "Public access" ON invoices;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Users can read own data" ON invoices;

-- Create new public access policies
CREATE POLICY "Public access" ON vehicles FOR ALL USING (true);
CREATE POLICY "Public access" ON tolls FOR ALL USING (true);
CREATE POLICY "Public access" ON invoices FOR ALL USING (true);