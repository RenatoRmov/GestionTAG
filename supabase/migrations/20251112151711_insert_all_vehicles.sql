/*
  # Insert all 24 vehicles into the database

  1. New Records
    - Insert 22 original vehicles
    - Insert 2 new vehicles (VJDK91 - Móvil 44 Anderson, KYFBB66 - Móvil 20)

  2. Data
    - All vehicles with their license plates, mobile numbers, and driver names
    - Total: 24 vehicles
*/

-- Insert all 24 vehicles (using ON CONFLICT to preserve existing data)
INSERT INTO vehicles (id, number, drivername, licenseplate) VALUES
  ('1', '91', 'Conductor 91', 'TDTP10'),
  ('2', '44', 'Conductor 44', 'HGDR71'),
  ('3', '19', 'Conductor 19', 'KDDV91'),
  ('4', '27', 'Conductor 27', 'TBZB28'),
  ('5', '32', 'Conductor 32', 'SSGW45'),
  ('6', '34', 'Conductor 34', 'LZRV27'),
  ('7', '37', 'Conductor 37', 'LTYB54'),
  ('8', '38', 'Conductor 38', 'KDDK25'),
  ('9', '44-2', 'Conductor 44-2', 'PSLW21'),
  ('10', '44-3', 'Conductor 44-3', 'PJSH64'),
  ('11', '44-4', 'Conductor 44-4', 'VDCH69'),
  ('12', '45', 'Conductor 45', 'STXR95'),
  ('13', '62', 'Conductor 62', 'KDDK41'),
  ('14', '72', 'Conductor 72', 'KTXR50'),
  ('15', '83', 'Conductor 83', 'HWWZ14'),
  ('16', '84', 'Conductor 84', 'JSSG22'),
  ('17', '87', 'Conductor 87', 'VDCL43'),
  ('18', '92', 'Conductor 92', 'KTXR48'),
  ('19', '125', 'Conductor 125', 'SRHZ13'),
  ('20', '152', 'Conductor 152', 'SRHZ15'),
  ('21', '07', 'Conductor 07', 'JWDL16'),
  ('22', '15', 'Conductor 15', 'KFHX32'),
  ('23', '44', 'Anderson', 'VJDK91'),
  ('24', '20', 'Conductor 20', 'KYFBB66')
ON CONFLICT (id) DO UPDATE SET
  number = EXCLUDED.number,
  drivername = EXCLUDED.drivername,
  licenseplate = EXCLUDED.licenseplate;
