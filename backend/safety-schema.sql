-- Safety and Communication Database Schema
-- This file contains all safety-related tables for the ride-share app

-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Safety Settings Table
CREATE TABLE IF NOT EXISTS safety_settings (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    auto_share_location BOOLEAN DEFAULT TRUE,
    emergency_alerts BOOLEAN DEFAULT TRUE,
    ride_sharing BOOLEAN DEFAULT TRUE,
    background_tracking BOOLEAN DEFAULT TRUE,
    voice_commands BOOLEAN DEFAULT TRUE,
    panic_button_enabled BOOLEAN DEFAULT TRUE,
    auto_sos BOOLEAN DEFAULT FALSE,
    night_mode BOOLEAN DEFAULT FALSE,
    silent_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(driver_id)
);

-- Incident Reports Table
CREATE TABLE IF NOT EXISTS incident_reports (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    location_latitude DOUBLE PRECISION,
    location_longitude DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'pending', -- pending, investigating, resolved, closed
    reported_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    admin_notes TEXT
);

-- Emergency Alerts Table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL, -- sos, panic, automatic
    location_latitude DOUBLE PRECISION,
    location_longitude DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'active', -- active, responded, resolved
    triggered_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    resolved_at TIMESTAMP,
    response_time_seconds INTEGER,
    notes TEXT
);

-- Communication History Table
CREATE TABLE IF NOT EXISTS communication_history (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
    communication_type VARCHAR(50) NOT NULL, -- location_shared, trip_update, emergency_alert, voice_command
    recipient_type VARCHAR(20) DEFAULT 'contacts', -- contacts, emergency_services, admin
    recipient_details JSONB, -- Store contact info or service details
    message_content TEXT,
    status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read, failed
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    read_at TIMESTAMP
);

-- Location Sharing Table
CREATE TABLE IF NOT EXISTS location_sharing (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    shared_with JSONB, -- Array of contact IDs or service names
    shared_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Trip Sharing Table
CREATE TABLE IF NOT EXISTS trip_sharing (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
    pickup_address TEXT,
    destination_address TEXT,
    estimated_arrival TIMESTAMP,
    current_location_latitude DOUBLE PRECISION,
    current_location_longitude DOUBLE PRECISION,
    shared_with JSONB, -- Array of contact IDs
    shared_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Voice Commands Log Table
CREATE TABLE IF NOT EXISTS voice_commands_log (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
    command_text TEXT NOT NULL,
    recognized_command VARCHAR(100),
    confidence_score DECIMAL(3,2),
    executed BOOLEAN DEFAULT FALSE,
    execution_result TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Safety Metrics Table
CREATE TABLE IF NOT EXISTS safety_metrics (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    total_rides INTEGER DEFAULT 0,
    safe_rides INTEGER DEFAULT 0,
    incidents INTEGER DEFAULT 0,
    average_response_time_seconds DECIMAL(5,2),
    last_incident_date DATE,
    safety_score INTEGER DEFAULT 100, -- 0-100 scale
    calculated_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Driver Verification Status Table
CREATE TABLE IF NOT EXISTS driver_verification (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    photo_verified BOOLEAN DEFAULT FALSE,
    license_verified BOOLEAN DEFAULT FALSE,
    insurance_verified BOOLEAN DEFAULT FALSE,
    background_check_verified BOOLEAN DEFAULT FALSE,
    vehicle_inspection_verified BOOLEAN DEFAULT FALSE,
    verification_score INTEGER DEFAULT 0, -- 0-100 scale
    last_verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_driver_id ON emergency_contacts(driver_id);
CREATE INDEX IF NOT EXISTS idx_safety_settings_driver_id ON safety_settings(driver_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_driver_id ON incident_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_ride_id ON incident_reports(ride_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_driver_id ON emergency_alerts(driver_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_ride_id ON emergency_alerts(ride_id);
CREATE INDEX IF NOT EXISTS idx_communication_history_driver_id ON communication_history(driver_id);
CREATE INDEX IF NOT EXISTS idx_communication_history_ride_id ON communication_history(ride_id);
CREATE INDEX IF NOT EXISTS idx_location_sharing_driver_id ON location_sharing(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_sharing_driver_id ON trip_sharing(driver_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_log_driver_id ON voice_commands_log(driver_id);
CREATE INDEX IF NOT EXISTS idx_safety_metrics_driver_id ON safety_metrics(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_verification_driver_id ON driver_verification(driver_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safety_settings_updated_at BEFORE UPDATE ON safety_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safety_metrics_updated_at BEFORE UPDATE ON safety_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_verification_updated_at BEFORE UPDATE ON driver_verification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default safety settings for existing drivers
INSERT INTO safety_settings (driver_id, auto_share_location, emergency_alerts, ride_sharing, background_tracking, voice_commands, panic_button_enabled)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
FROM drivers
WHERE id NOT IN (SELECT driver_id FROM safety_settings);

-- Insert default safety metrics for existing drivers
INSERT INTO safety_metrics (driver_id, total_rides, safe_rides, incidents, average_response_time_seconds, safety_score)
SELECT id, 0, 0, 0, 0.0, 100
FROM drivers
WHERE id NOT IN (SELECT driver_id FROM safety_metrics);

-- Insert default verification status for existing drivers
INSERT INTO driver_verification (driver_id, photo_verified, license_verified, insurance_verified, background_check_verified, vehicle_inspection_verified, verification_score)
SELECT id, FALSE, FALSE, FALSE, FALSE, FALSE, 0
FROM drivers
WHERE id NOT IN (SELECT driver_id FROM driver_verification); 