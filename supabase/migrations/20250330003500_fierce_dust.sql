/*
  # Fix column names in vehicles table

  1. Changes
    - Rename columns to match frontend code
    - Ensure consistent naming across tables
    - Fix case sensitivity issues

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS tolls;
DROP TABLE IF EXISTS invoices;

-- Recreate vehicles table with correct column names
CREATE TABLE vehicles (
  id text PRIMARY KEY,
  number text NOT NULL,
  drivername text NOT NULL,
  licenseplate text NOT NULL
);

-- Recreate tolls table
CREATE TABLE tolls (
  id text PRIMARY KEY,
  highway text NOT NULL,
  licenseplate text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL
);

-- Recreate invoices table
CREATE TABLE invoices (
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

-- Create policies
CREATE POLICY "Public access" ON vehicles FOR ALL USING (true);
CREATE POLICY "Public access" ON tolls FOR ALL USING (true);
CREATE POLICY "Public access" ON invoices FOR ALL USING (true);