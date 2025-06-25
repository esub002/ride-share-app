-- Add phone column to drivers table for mobile authentication
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;

-- Add index for faster phone lookups
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);

-- Update existing drivers table structure if needed
-- This ensures the phone column exists and is properly indexed 