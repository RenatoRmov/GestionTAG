/*
  # Fix database tables structure

  1. Changes
    - Ensure tables exist with correct column names
    - Set up proper security policies
    - Avoid dropping tables to prevent data loss

  2. Security
    - Enable RLS on all tables
    - Add policies for public access
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

-- Create policies if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON vehicles FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tolls' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON tolls FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON invoices FOR ALL USING (true);
  END IF;
END $$;