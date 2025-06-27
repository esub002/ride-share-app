-- Advanced Analytics & Reporting System Database Schema
-- This file contains all analytics-related tables for comprehensive reporting

-- Analytics Events Table - Tracks all user actions and system events
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- ride_requested, ride_completed, payment_made, safety_alert, etc.
    event_category VARCHAR(50) NOT NULL, -- ride, payment, safety, user, system
    user_id INTEGER, -- Can be rider or driver
    user_type VARCHAR(20), -- 'rider' or 'driver'
    ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    metadata JSONB, -- Flexible storage for event-specific data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_analytics_events_type (event_type),
    INDEX idx_analytics_events_category (event_category),
    INDEX idx_analytics_events_user (user_id, user_type),
    INDEX idx_analytics_events_created (created_at)
);

-- Driver Performance Metrics Table
CREATE TABLE IF NOT EXISTS driver_performance_metrics (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Ride Metrics
    total_rides INTEGER DEFAULT 0,
    completed_rides INTEGER DEFAULT 0,
    cancelled_rides INTEGER DEFAULT 0,
    average_ride_duration_minutes DECIMAL(8,2),
    total_distance_km DECIMAL(10,2),
    average_ride_distance_km DECIMAL(8,2),
    
    -- Earnings Metrics
    total_earnings DECIMAL(10,2) DEFAULT 0,
    average_earnings_per_ride DECIMAL(8,2),
    tips_received DECIMAL(8,2) DEFAULT 0,
    tips_count INTEGER DEFAULT 0,
    
    -- Performance Metrics
    average_rating DECIMAL(3,2),
    total_ratings INTEGER DEFAULT 0,
    on_time_percentage DECIMAL(5,2),
    acceptance_rate DECIMAL(5,2),
    
    -- Safety Metrics
    safety_incidents INTEGER DEFAULT 0,
    safety_score INTEGER DEFAULT 100,
    emergency_alerts INTEGER DEFAULT 0,
    
    -- Operational Metrics
    online_hours DECIMAL(8,2) DEFAULT 0,
    peak_hours_worked INTEGER DEFAULT 0,
    fuel_efficiency_rating DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(driver_id, period_type, period_start),
    INDEX idx_driver_performance_driver (driver_id),
    INDEX idx_driver_performance_period (period_type, period_start, period_end)
);

-- Rider Analytics Table
CREATE TABLE IF NOT EXISTS rider_analytics (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Ride Metrics
    total_rides INTEGER DEFAULT 0,
    completed_rides INTEGER DEFAULT 0,
    cancelled_rides INTEGER DEFAULT 0,
    average_ride_cost DECIMAL(8,2),
    total_spent DECIMAL(10,2) DEFAULT 0,
    
    -- Behavior Metrics
    average_rating_given DECIMAL(3,2),
    tips_given DECIMAL(8,2) DEFAULT 0,
    tips_count INTEGER DEFAULT 0,
    preferred_payment_method VARCHAR(50),
    
    -- Usage Patterns
    peak_usage_hours JSONB, -- Store hourly usage patterns
    preferred_areas JSONB, -- Store frequently visited areas
    average_ride_distance_km DECIMAL(8,2),
    
    -- Loyalty Metrics
    loyalty_points INTEGER DEFAULT 0,
    referral_count INTEGER DEFAULT 0,
    days_since_last_ride INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(rider_id, period_type, period_start),
    INDEX idx_rider_analytics_rider (rider_id),
    INDEX idx_rider_analytics_period (period_type, period_start, period_end)
);

-- System Performance Metrics Table
CREATE TABLE IF NOT EXISTS system_performance_metrics (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL, -- hourly, daily, weekly, monthly
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Platform Metrics
    total_rides INTEGER DEFAULT 0,
    active_drivers INTEGER DEFAULT 0,
    active_riders INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    
    -- Performance Metrics
    average_response_time_ms INTEGER,
    system_uptime_percentage DECIMAL(5,2),
    error_rate DECIMAL(5,4),
    peak_concurrent_users INTEGER,
    
    -- Revenue Metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    platform_fees DECIMAL(10,2) DEFAULT 0,
    average_order_value DECIMAL(8,2),
    
    -- Safety Metrics
    safety_incidents INTEGER DEFAULT 0,
    emergency_alerts INTEGER DEFAULT 0,
    resolved_incidents INTEGER DEFAULT 0,
    
    -- Geographic Metrics
    top_service_areas JSONB, -- Store top areas by ride volume
    coverage_area_km2 DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(period_type, period_start),
    INDEX idx_system_performance_period (period_type, period_start, period_end)
);

-- Revenue Analytics Table
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Revenue Breakdown
    gross_revenue DECIMAL(12,2) DEFAULT 0,
    net_revenue DECIMAL(12,2) DEFAULT 0,
    platform_fees DECIMAL(10,2) DEFAULT 0,
    driver_payouts DECIMAL(12,2) DEFAULT 0,
    
    -- Payment Metrics
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    average_transaction_value DECIMAL(8,2),
    
    -- Payment Method Distribution
    payment_methods JSONB, -- Store breakdown by payment method
    
    -- Regional Revenue
    revenue_by_region JSONB, -- Store revenue breakdown by region
    
    -- Growth Metrics
    revenue_growth_percentage DECIMAL(5,2),
    transaction_growth_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(period_type, period_start),
    INDEX idx_revenue_analytics_period (period_type, period_start, period_end)
);

-- Safety Analytics Table
CREATE TABLE IF NOT EXISTS safety_analytics (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Incident Metrics
    total_incidents INTEGER DEFAULT 0,
    resolved_incidents INTEGER DEFAULT 0,
    pending_incidents INTEGER DEFAULT 0,
    incident_resolution_rate DECIMAL(5,2),
    
    -- Incident Types
    incident_types JSONB, -- Store breakdown by incident type
    
    -- Emergency Metrics
    emergency_alerts INTEGER DEFAULT 0,
    sos_alerts INTEGER DEFAULT 0,
    panic_alerts INTEGER DEFAULT 0,
    average_response_time_seconds INTEGER,
    
    -- Safety Scores
    average_driver_safety_score DECIMAL(5,2),
    average_ride_safety_score DECIMAL(5,2),
    
    -- Geographic Safety
    high_risk_areas JSONB, -- Store areas with high incident rates
    safe_areas JSONB, -- Store areas with low incident rates
    
    -- Prevention Metrics
    preventive_alerts INTEGER DEFAULT 0,
    safety_features_used JSONB, -- Store usage of safety features
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(period_type, period_start),
    INDEX idx_safety_analytics_period (period_type, period_start, period_end)
);

-- User Behavior Analytics Table
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'rider' or 'driver'
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Session Metrics
    total_sessions INTEGER DEFAULT 0,
    average_session_duration_minutes INTEGER,
    total_time_spent_minutes INTEGER DEFAULT 0,
    
    -- Feature Usage
    features_used JSONB, -- Store which features were used and how often
    
    -- App Performance
    app_crashes INTEGER DEFAULT 0,
    average_load_time_ms INTEGER,
    error_encounters INTEGER DEFAULT 0,
    
    -- Engagement Metrics
    daily_active_days INTEGER DEFAULT 0,
    retention_rate DECIMAL(5,2),
    churn_probability DECIMAL(5,2),
    
    -- Device & Platform
    device_types JSONB, -- Store device type distribution
    platform_usage JSONB, -- Store iOS/Android usage
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, user_type, period_type, period_start),
    INDEX idx_user_behavior_user (user_id, user_type),
    INDEX idx_user_behavior_period (period_type, period_start, period_end)
);

-- Geographic Analytics Table
CREATE TABLE IF NOT EXISTS geographic_analytics (
    id SERIAL PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Ride Metrics
    total_rides INTEGER DEFAULT 0,
    average_ride_distance_km DECIMAL(8,2),
    average_ride_duration_minutes DECIMAL(8,2),
    average_ride_cost DECIMAL(8,2),
    
    -- Driver Metrics
    active_drivers INTEGER DEFAULT 0,
    average_driver_rating DECIMAL(3,2),
    driver_satisfaction_score DECIMAL(5,2),
    
    -- Rider Metrics
    active_riders INTEGER DEFAULT 0,
    average_rider_rating DECIMAL(3,2),
    rider_satisfaction_score DECIMAL(5,2),
    
    -- Demand Patterns
    peak_hours JSONB, -- Store peak demand hours
    demand_heatmap JSONB, -- Store demand by area within region
    
    -- Safety Metrics
    safety_incidents INTEGER DEFAULT 0,
    safety_score DECIMAL(5,2),
    
    -- Economic Metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(8,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(region_name, period_type, period_start),
    INDEX idx_geographic_analytics_region (region_name),
    INDEX idx_geographic_analytics_period (period_type, period_start, period_end)
);

-- Analytics Reports Table - Stores generated reports
CREATE TABLE IF NOT EXISTS analytics_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL, -- driver_performance, revenue_analysis, safety_report, etc.
    report_name VARCHAR(255) NOT NULL,
    generated_by INTEGER, -- User ID who generated the report
    report_period JSONB, -- Store date range and filters
    report_data JSONB, -- Store the actual report data
    report_format VARCHAR(20) DEFAULT 'json', -- json, csv, pdf, excel
    file_path VARCHAR(500), -- Path to stored file if exported
    status VARCHAR(20) DEFAULT 'completed', -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- When the report expires
    
    INDEX idx_analytics_reports_type (report_type),
    INDEX idx_analytics_reports_created (created_at),
    INDEX idx_analytics_reports_status (status)
);

-- Analytics Dashboard Configurations
CREATE TABLE IF NOT EXISTS analytics_dashboards (
    id SERIAL PRIMARY KEY,
    dashboard_name VARCHAR(255) NOT NULL,
    dashboard_type VARCHAR(50) NOT NULL, -- admin, driver, rider, manager
    created_by INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    dashboard_config JSONB, -- Store dashboard layout and widgets
    refresh_interval_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_analytics_dashboards_type (dashboard_type),
    INDEX idx_analytics_dashboards_created_by (created_by)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_ride_id ON analytics_events(ride_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata ON analytics_events USING GIN(metadata);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_driver_performance_updated_at BEFORE UPDATE ON driver_performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rider_analytics_updated_at BEFORE UPDATE ON rider_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_behavior_updated_at BEFORE UPDATE ON user_behavior_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_dashboards_updated_at BEFORE UPDATE ON analytics_dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default dashboard configurations
INSERT INTO analytics_dashboards (dashboard_name, dashboard_type, created_by, is_public, dashboard_config) VALUES
('Admin Overview', 'admin', 1, true, '{"widgets": ["revenue_overview", "safety_metrics", "system_performance", "user_growth"]}'),
('Driver Performance', 'driver', 1, true, '{"widgets": ["earnings_summary", "ride_history", "safety_score", "performance_metrics"]}'),
('Rider Insights', 'rider', 1, true, '{"widgets": ["ride_history", "spending_analysis", "preferences", "loyalty_status"]}'),
('Safety Monitor', 'manager', 1, true, '{"widgets": ["incident_overview", "emergency_alerts", "risk_areas", "response_times"]}');

-- Create materialized views for frequently accessed analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_driver_performance AS
SELECT 
    driver_id,
    DATE(created_at) as date,
    COUNT(*) as total_rides,
    AVG(rating) as average_rating,
    SUM(earnings) as total_earnings
FROM rides 
WHERE status = 'completed' 
GROUP BY driver_id, DATE(created_at);

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_system_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_rides,
    COUNT(DISTINCT driver_id) as active_drivers,
    COUNT(DISTINCT rider_id) as active_riders,
    AVG(EXTRACT(EPOCH FROM (accepted_at - requested_at))) as avg_response_time_seconds
FROM rides 
GROUP BY DATE(created_at);

-- Create indexes on materialized views
CREATE INDEX IF NOT EXISTS idx_daily_driver_performance_driver_date ON daily_driver_performance(driver_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_system_metrics_date ON daily_system_metrics(date);

-- Refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_driver_performance;
    REFRESH MATERIALIZED VIEW daily_system_metrics;
END;
$$ LANGUAGE plpgsql; 