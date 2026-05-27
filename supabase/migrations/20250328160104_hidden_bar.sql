/*
  # Update tables for TAG management system

  1. Tables
    - `vehicles`
      - `id` (text, primary key)
      - `number` (text)
      - `driverName` (text)
      - `licensePlate` (text)
    - `tolls`
      - `id` (text, primary key)
      - `highway` (text)
      - `licensePlate` (text)
      - `amount` (numeric)
      - `month` (text)
    - `invoices`
      - `id` (text, primary key)
      - `highway` (text)
      - `agreementNumber` (text)
      - `amount` (numeric)
      - `month` (text)
      - `billingDate` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (if they don't exist)
*/

-- Create vehicles table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS vehicles (
    id text PRIMARY KEY,
    number text NOT NULL,
    "driverName" text NOT NULL,
    "licensePlate" text NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create tolls table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS tolls (
    id text PRIMARY KEY,
    highway text NOT NULL,
    "licensePlate" text NOT NULL,
    amount numeric NOT NULL,
    month text NOT NULL
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create invoices table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS invoices (
    id text PRIMARY KEY,
    highway text NOT NULL,
    "agreementNumber" text NOT NULL,
    amount numeric NOT NULL,
    month text NOT NULL,
    "billingDate" text NOT NULL
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