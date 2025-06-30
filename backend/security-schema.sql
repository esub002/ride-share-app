-- Security Schema for Ride Share App
-- This file contains all security-related database tables and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'driver', 'admin', 'support');
CREATE TYPE audit_action AS ENUM (
  'user_registration', 'user_login', 'user_logout', 'user_verification',
  'password_reset', 'password_change', 'profile_update', 'ride_request',
  'ride_accept', 'ride_complete', 'ride_cancel', 'payment_processed',
  'api_key_created', 'api_key_revoked', 'admin_action', 'security_alert'
);

-- Enhanced users table with security features
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verification_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verification_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Enhanced drivers table with security features
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'driver';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW();
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- API Keys table for third-party integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '[]',
    rate_limit_per_minute INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action audit_action NOT NULL,
    table_name VARCHAR(100),
    user_id INTEGER,
    user_role user_role,
    ip_address INET,
    user_agent TEXT,
    method VARCHAR(10),
    url TEXT,
    status_code INTEGER,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Security events table for monitoring
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id INTEGER,
    ip_address INET,
    user_agent TEXT,
    description TEXT,
    metadata JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Session management table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL,
    user_role user_role NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_logins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    attempt_count INTEGER DEFAULT 1,
    first_attempt TIMESTAMP DEFAULT NOW(),
    last_attempt TIMESTAMP DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name VARCHAR(255) NOT NULL,
    key_type VARCHAR(50) NOT NULL, -- 'ip', 'user', 'api_key'
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Two-factor authentication backup codes
CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL,
    user_role user_role NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Device management for security
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL,
    user_role user_role NOT NULL,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    os_info TEXT,
    browser_info TEXT,
    ip_address INET,
    is_trusted BOOLEAN DEFAULT FALSE,
    last_used TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Security settings per user
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL,
    user_role user_role NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    login_alerts BOOLEAN DEFAULT TRUE,
    suspicious_activity_alerts BOOLEAN DEFAULT TRUE,
    session_timeout_minutes INTEGER DEFAULT 60,
    max_concurrent_sessions INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, user_role)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);
CREATE INDEX IF NOT EXISTS idx_drivers_role ON drivers(role);
CREATE INDEX IF NOT EXISTS idx_drivers_verified ON drivers(verified);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(available);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON drivers(created_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON failed_logins(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_ip_address ON failed_logins(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_logins_last_attempt ON failed_logins(last_attempt);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_name ON rate_limits(key_name);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON user_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at BEFORE UPDATE ON user_security_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old audit logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old failed login attempts
CREATE OR REPLACE FUNCTION cleanup_old_failed_logins()
RETURNS void AS $$
BEGIN
    DELETE FROM failed_logins WHERE last_attempt < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup functions (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs();');
-- SELECT cron.schedule('cleanup-expired-sessions', '*/15 * * * *', 'SELECT cleanup_expired_sessions();');
-- SELECT cron.schedule('cleanup-rate-limits', '*/5 * * * *', 'SELECT cleanup_old_rate_limits();');
-- SELECT cron.schedule('cleanup-failed-logins', '0 */6 * * *', 'SELECT cleanup_old_failed_logins();');

-- Insert default admin user (password: Admin123!)
INSERT INTO users (name, email, password, role, verified, created_at) 
VALUES (
    'Admin User',
    'admin@rideshare.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8O', -- Admin123!
    'admin',
    TRUE,
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert default API key for testing
INSERT INTO api_keys (name, key_hash, user_id, permissions, rate_limit_per_minute, is_active)
VALUES (
    'Test API Key',
    '$2a$12$test.hash.for.api.key',
    1,
    '["read:all", "write:all"]',
    1000,
    TRUE
) ON CONFLICT DO NOTHING; 