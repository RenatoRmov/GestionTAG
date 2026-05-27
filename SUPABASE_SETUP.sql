-- Supabase Manual Setup Script
-- Run this in your Supabase SQL Editor if the application shows no vehicles

-- First, verify the tables exist
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

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON vehicles;
DROP POLICY IF EXISTS "Enable insert access for all users" ON vehicles;
DROP POLICY IF EXISTS "Enable update access for all users" ON vehicles;
DROP POLICY IF EXISTS "Enable delete access for all users" ON vehicles;

DROP POLICY IF EXISTS "Enable read access for all users" ON tolls;
DROP POLICY IF EXISTS "Enable insert access for all users" ON tolls;
DROP POLICY IF EXISTS "Enable update access for all users" ON tolls;
DROP POLICY IF EXISTS "Enable delete access for all users" ON tolls;

DROP POLICY IF EXISTS "Enable read access for all users" ON invoices;
DROP POLICY IF EXISTS "Enable insert access for all users" ON invoices;
DROP POLICY IF EXISTS "Enable update access for all users" ON invoices;
DROP POLICY IF EXISTS "Enable delete access for all users" ON invoices;

-- Create public policies for all tables
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

-- Insert all 24 vehicles (only if they don't exist)
INSERT INTO vehicles (id, number, drivername, licenseplate) VALUES
  ('v1', '91', 'Conductor 91', 'TDTP10'),
  ('v2', '44', 'Conductor 44', 'HGDR71'),
  ('v3', '19', 'Conductor 19', 'KDDV91'),
  ('v4', '27', 'Conductor 27', 'TBZB28'),
  ('v5', '32', 'Conductor 32', 'SSGW45'),
  ('v6', '34', 'Conductor 34', 'LZRV27'),
  ('v7', '37', 'Conductor 37', 'LTYB54'),
  ('v8', '38', 'Conductor 38', 'KDDK25'),
  ('v9', '44-2', 'Conductor 44-2', 'PSLW21'),
  ('v10', '44-3', 'Conductor 44-3', 'PJSH64'),
  ('v11', '44-4', 'Conductor 44-4', 'VDCH69'),
  ('v12', '45', 'Conductor 45', 'STXR95'),
  ('v13', '62', 'Conductor 62', 'KDDK41'),
  ('v14', '72', 'Conductor 72', 'KTXR50'),
  ('v15', '83', 'Conductor 83', 'HWWZ14'),
  ('v16', '84', 'Conductor 84', 'JSSG22'),
  ('v17', '87', 'Conductor 87', 'VDCL43'),
  ('v18', '92', 'Conductor 92', 'KTXR48'),
  ('v19', '125', 'Conductor 125', 'SRHZ13'),
  ('v20', '152', 'Conductor 152', 'SRHZ15'),
  ('v21', '07', 'Conductor 07', 'JWDL16'),
  ('v22', '15', 'Conductor 15', 'KFHX32'),
  ('v23', '44', 'Anderson', 'VJDK91'),
  ('v24', '20', 'Conductor 20', 'KYFBB66')
ON CONFLICT (id) DO NOTHING;
