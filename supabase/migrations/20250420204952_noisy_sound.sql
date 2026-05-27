/*
  # Create tables for TAG management system

  1. New Tables
    - `vehicles`
      - `id` (text, primary key)
      - `number` (text, vehicle number)
      - `drivername` (text, driver's name)
      - `licenseplate` (text, vehicle license plate)
    
    - `tolls`
      - `id` (text, primary key)
      - `highway` (text, highway name)
      - `licenseplate` (text, references vehicles)
      - `amount` (numeric, toll amount)
      - `month` (text, billing month)
    
    - `invoices`
      - `id` (text, primary key)
      - `highway` (text, highway name)
      - `agreementnumber` (text, agreement number)
      - `amount` (numeric, invoice amount)
      - `month` (text, billing month)
      - `billingdate` (text, billing date)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to perform all operations
*/

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  number text NOT NULL,
  drivername text NOT NULL,
  licenseplate text NOT NULL
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create tolls table
CREATE TABLE IF NOT EXISTS tolls (
  id text PRIMARY KEY,
  highway text NOT NULL,
  licenseplate text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL
);

ALTER TABLE tolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON tolls
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  highway text NOT NULL,
  agreementnumber text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL,
  billingdate text NOT NULL
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);