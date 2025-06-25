-- Add columns to rides table for earnings tracking
ALTER TABLE rides ADD COLUMN IF NOT EXISTS estimated_fare DECIMAL(10,2) DEFAULT 15.00;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Update existing rides to have a default fare if they don't have one
UPDATE rides SET estimated_fare = 15.00 WHERE estimated_fare IS NULL;

-- Add index for faster earnings queries
CREATE INDEX IF NOT EXISTS idx_rides_driver_status_created ON rides(driver_id, status, created_at); 