/*
  # Add new vehicles to the database

  1. New Vehicles
    - VJDK91 - Móvil 44 (Anderson)
    - KYFBB66 - Móvil 20

  2. Changes
    - Insert 2 new vehicles into the vehicles table
    - Anderson is the driver name for VJDK91 - Móvil 44
    - Maintain existing data integrity
*/

-- Insert the 2 new vehicles into the database
-- Use DO block to check if they already exist before inserting
DO $$
BEGIN
  -- Insert VJDK91 - Móvil 44 (Anderson) if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM vehicles WHERE licenseplate = 'VJDK91') THEN
    INSERT INTO vehicles (id, number, drivername, licenseplate)
    VALUES ('23', '44', 'Anderson', 'VJDK91');
  END IF;

  -- Insert KYFBB66 - Móvil 20 if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM vehicles WHERE licenseplate = 'KYFBB66') THEN
    INSERT INTO vehicles (id, number, drivername, licenseplate)
    VALUES ('24', '20', 'Conductor 20', 'KYFBB66');
  END IF;
END $$;
