/*
  # Create tables for TAG management system

  1. New Tables
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
    - Add policies for public access (since this is a public application)
*/

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  number text NOT NULL,
  driverName text NOT NULL,
  licensePlate text NOT NULL
);

-- Create tolls table
CREATE TABLE IF NOT EXISTS tolls (
  id text PRIMARY KEY,
  highway text NOT NULL,
  licensePlate text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  highway text NOT NULL,
  agreementNumber text NOT NULL,
  amount numeric NOT NULL,
  month text NOT NULL,
  billingDate text NOT NULL
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public access" ON vehicles FOR ALL USING (true);
CREATE POLICY "Public access" ON tolls FOR ALL USING (true);
CREATE POLICY "Public access" ON invoices FOR ALL USING (true);