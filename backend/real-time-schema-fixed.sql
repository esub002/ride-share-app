-- Real-Time Features Database Schema (Fixed Version)
-- Comprehensive schema for analytics, geofencing, communication, and tracking

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Real-time analytics metrics
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(50),
    category VARCHAR(50) NOT NULL, -- 'performance', 'business', 'safety', 'system'
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events for tracking user actions
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    user_id INTEGER,
    user_role VARCHAR(20),
    event_data JSONB,
    session_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time alerts and notifications
CREATE TABLE IF NOT EXISTS analytics_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'warning', 'critical', 'info'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    category VARCHAR(50) NOT NULL, -- 'system', 'business', 'safety', 'performance'
    triggered_by VARCHAR(50), -- metric name or event that triggered alert
    threshold_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INTEGER,
    acknowledged_at TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- LOCATION TRACKING TABLES
-- =====================================================

-- Geofences for location-based triggers
CREATE TABLE IF NOT EXISTS geofences (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'pickup_zone', 'dropoff_zone', 'restricted_area', 'speed_limit_zone'
    center_lat DECIMAL(10,8) NOT NULL,
    center_lng DECIMAL(11,8) NOT NULL,
    radius DECIMAL(10,2) NOT NULL, -- in meters
    properties JSONB, -- additional properties like speed limit, messages, etc.
    active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Location tracking sessions
CREATE TABLE IF NOT EXISTS tracking_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    total_distance DECIMAL(10,2), -- in kilometers
    duration INTEGER, -- in seconds
    geofences_entered JSONB, -- array of geofence IDs entered during session
    route_data JSONB, -- route information and waypoints
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Location history for users
CREATE TABLE IF NOT EXISTS location_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(8,2),
    speed DECIMAL(8,2), -- in m/s
    heading DECIMAL(5,2), -- in degrees
    altitude DECIMAL(8,2),
    timestamp TIMESTAMP NOT NULL,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Geofence events (when users enter/exit geofences)
CREATE TABLE IF NOT EXISTS geofence_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    geofence_id INTEGER NOT NULL REFERENCES geofences(id),
    event_type VARCHAR(20) NOT NULL, -- 'entered', 'exited'
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    distance DECIMAL(10,2), -- distance from geofence center
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Messages between users
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(50) PRIMARY KEY, -- UUID format
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'voice', 'location'
    ride_id INTEGER,
    metadata JSONB, -- additional message data
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Voice and video call records
CREATE TABLE IF NOT EXISTS call_records (
    id SERIAL PRIMARY KEY,
    call_id VARCHAR(50) UNIQUE NOT NULL,
    caller_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    call_type VARCHAR(20) DEFAULT 'voice', -- 'voice', 'video'
    ride_id INTEGER,
    status VARCHAR(20) NOT NULL, -- 'initiated', 'ringing', 'accepted', 'rejected', 'ended', 'timeout'
    start_time TIMESTAMP NOT NULL,
    answer_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER, -- in seconds
    rejection_reason VARCHAR(100),
    ended_by INTEGER, -- user who ended the call
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Voice rooms for active calls
CREATE TABLE IF NOT EXISTS voice_rooms (
    id VARCHAR(50) PRIMARY KEY,
    call_id VARCHAR(50) NOT NULL REFERENCES call_records(call_id),
    room_type VARCHAR(20) DEFAULT 'voice', -- 'voice', 'video'
    participants JSONB, -- array of participant user IDs
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    max_participants INTEGER DEFAULT 2,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Typing indicators
CREATE TABLE IF NOT EXISTS typing_indicators (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    ride_id INTEGER,
    started_at TIMESTAMP NOT NULL,
    stopped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- REAL-TIME SYSTEM TABLES
-- =====================================================

-- Socket connections tracking
CREATE TABLE IF NOT EXISTS socket_connections (
    id SERIAL PRIMARY KEY,
    socket_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    connection_time TIMESTAMP NOT NULL,
    disconnection_time TIMESTAMP,
    duration INTEGER, -- in seconds
    disconnect_reason VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time events log
CREATE TABLE IF NOT EXISTS realtime_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'healthy', 'warning', 'critical'
    threshold_warning DECIMAL(15,2),
    threshold_critical DECIMAL(15,2),
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_timestamp ON analytics_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_category ON analytics_metrics(category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_timestamp ON analytics_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_type ON analytics_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_acknowledged ON analytics_alerts(acknowledged);

CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(active);
CREATE INDEX IF NOT EXISTS idx_geofences_type ON geofences(type);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_user_id ON tracking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_start_time ON tracking_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_location_history_user_id ON location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON location_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_location_history_session_id ON location_history(session_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_user_id ON geofence_events(user_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence_id ON geofence_events(geofence_id);
CREATE INDEX IF NOT EXISTS idx_geofence_events_timestamp ON geofence_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_ride_id ON messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_call_records_caller_id ON call_records(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_records_receiver_id ON call_records(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_records_status ON call_records(status);
CREATE INDEX IF NOT EXISTS idx_call_records_start_time ON call_records(start_time);
CREATE INDEX IF NOT EXISTS idx_voice_rooms_call_id ON voice_rooms(call_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_sender_id ON typing_indicators(sender_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_receiver_id ON typing_indicators(receiver_id);

CREATE INDEX IF NOT EXISTS idx_socket_connections_user_id ON socket_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_socket_connections_connection_time ON socket_connections(connection_time);
CREATE INDEX IF NOT EXISTS idx_realtime_events_event_type ON realtime_events(event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_events_timestamp ON realtime_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_events_processed ON realtime_events(processed);
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for geofences table
CREATE TRIGGER update_geofences_updated_at 
    BEFORE UPDATE ON geofences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371000; -- Earth's radius in meters
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a point is within a geofence
CREATE OR REPLACE FUNCTION is_within_geofence(point_lat DECIMAL, point_lng DECIMAL, geofence_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    geofence_record RECORD;
    distance DECIMAL;
BEGIN
    SELECT center_lat, center_lng, radius INTO geofence_record 
    FROM geofences WHERE id = geofence_id AND active = TRUE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    distance := calculate_distance(point_lat, point_lng, geofence_record.center_lat, geofence_record.center_lng);
    RETURN distance <= geofence_record.radius;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for active users
CREATE OR REPLACE VIEW active_users AS
SELECT 
    user_id,
    user_role,
    COUNT(*) as connection_count,
    MAX(connection_time) as last_connection
FROM socket_connections 
WHERE disconnection_time IS NULL 
GROUP BY user_id, user_role;

-- View for real-time metrics
CREATE OR REPLACE VIEW realtime_metrics AS
SELECT 
    category,
    metric_name,
    AVG(metric_value) as avg_value,
    MAX(metric_value) as max_value,
    MIN(metric_value) as min_value,
    COUNT(*) as data_points,
    MAX(timestamp) as last_updated
FROM analytics_metrics 
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY category, metric_name;

-- View for geofence activity
CREATE OR REPLACE VIEW geofence_activity AS
SELECT 
    g.name as geofence_name,
    g.type as geofence_type,
    COUNT(ge.event_type) as event_count,
    COUNT(CASE WHEN ge.event_type = 'entered' THEN 1 END) as entries,
    COUNT(CASE WHEN ge.event_type = 'exited' THEN 1 END) as exits,
    MAX(ge.timestamp) as last_activity
FROM geofences g
LEFT JOIN geofence_events ge ON g.id = ge.geofence_id
WHERE g.active = TRUE
GROUP BY g.id, g.name, g.type; 