/*
  # Create TAG Management System Tables

  1. New Tables
    - `vehicles` - Stores vehicle information
      - `id` (text, primary key)
      - `number` (text, vehicle number)
      - `drivername` (text, driver name)
      - `licenseplate` (text, license plate)
    
    - `tolls` - Stores toll/tag expenses
      - `id` (text, primary key)
      - `highway` (text, highway name)
      - `licenseplate` (text, vehicle license plate)
      - `amount` (numeric, toll amount)
      - `month` (text, billing month)
    
    - `invoices` - Stores highway invoices
      - `id` (text, primary key)
      - `highway` (text, highway name)
      - `agreementnumber` (text, agreement number)
      - `amount` (numeric, invoice amount)
      - `month` (text, billing month)
      - `billingdate` (text, billing date)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (anon and authenticated users)
*/

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  number text NOT NULL,
  drivername text NOT NULL,
  licenseplate text NOT NULL
);

-- Create tolls table
CREATE TABLE IF NOT EXISTS tolls (
  id text PRIMARY KEY,
  highway text NOT NULL,
  licenseplate text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  highway text NOT NULL,
  agreementnumber text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL,
  billingdate text NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public access" ON vehicles;
DROP POLICY IF EXISTS "Public access" ON tolls;
DROP POLICY IF EXISTS "Public access" ON invoices;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON tolls;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON invoices;

-- Create policies for public access (anon and authenticated)
CREATE POLICY "Enable read access for all users" ON vehicles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON vehicles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON vehicles
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON vehicles
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON tolls
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON tolls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON tolls
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON tolls
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON invoices
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON invoices
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON invoices
  FOR DELETE USING (true);