# Advanced Analytics & Reporting System

## Overview

The Advanced Analytics & Reporting System provides comprehensive insights into ride-share operations, driver performance, rider behavior, revenue analysis, and safety metrics. This system enables data-driven decision making for administrators, drivers, and riders.

## Features

### 📊 **Analytics Categories**

1. **Driver Performance Analytics**
   - Ride completion rates
   - Earnings analysis
   - Safety scores
   - Response times
   - Customer ratings
   - Operational efficiency metrics

2. **Rider Analytics**
   - Usage patterns
   - Spending analysis
   - Ride preferences
   - Loyalty metrics
   - Peak usage hours

3. **System Performance Analytics**
   - Platform metrics
   - Response times
   - Error rates
   - User growth
   - System uptime

4. **Revenue Analytics**
   - Gross and net revenue
   - Transaction analysis
   - Payment method distribution
   - Regional revenue breakdown
   - Growth metrics

5. **Safety Analytics**
   - Incident tracking
   - Emergency alerts
   - Response times
   - Risk area identification
   - Prevention metrics

### 🎯 **Key Capabilities**

- **Real-time Event Tracking**: Track all user actions and system events
- **Periodic Analytics**: Daily, weekly, monthly, and yearly reporting
- **Custom Reports**: Generate on-demand reports with filters
- **Dashboard Views**: Role-based dashboards for different user types
- **Materialized Views**: Optimized queries for frequently accessed data
- **Data Export**: Export reports in multiple formats

## Database Schema

### Core Tables

#### `analytics_events`
Tracks all user actions and system events for comprehensive analysis.

```sql
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    user_id INTEGER,
    user_type VARCHAR(20),
    ride_id INTEGER REFERENCES rides(id),
    session_id VARCHAR(255),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `driver_performance_metrics`
Stores calculated driver performance metrics for different time periods.

```sql
CREATE TABLE driver_performance_metrics (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_rides INTEGER DEFAULT 0,
    completed_rides INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2),
    safety_score INTEGER DEFAULT 100,
    -- ... additional metrics
);
```

#### `rider_analytics`
Tracks rider behavior and usage patterns.

```sql
CREATE TABLE rider_analytics (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER REFERENCES users(id),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_rides INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    peak_usage_hours JSONB,
    -- ... additional metrics
);
```

#### `system_performance_metrics`
Monitors overall system performance and health.

```sql
CREATE TABLE system_performance_metrics (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    total_rides INTEGER DEFAULT 0,
    active_drivers INTEGER DEFAULT 0,
    active_riders INTEGER DEFAULT 0,
    average_response_time_ms INTEGER,
    -- ... additional metrics
);
```

#### `revenue_analytics`
Tracks financial performance and revenue metrics.

```sql
CREATE TABLE revenue_analytics (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_revenue DECIMAL(12,2) DEFAULT 0,
    net_revenue DECIMAL(12,2) DEFAULT 0,
    platform_fees DECIMAL(10,2) DEFAULT 0,
    -- ... additional metrics
);
```

#### `safety_analytics`
Monitors safety incidents and emergency responses.

```sql
CREATE TABLE safety_analytics (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_incidents INTEGER DEFAULT 0,
    emergency_alerts INTEGER DEFAULT 0,
    average_response_time_seconds INTEGER,
    -- ... additional metrics
);
```

## API Endpoints

### Driver Performance Analytics

```http
GET /api/analytics/driver-performance
```

**Parameters:**
- `driverId` (required): Driver ID
- `periodType` (required): daily, weekly, monthly, yearly
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

**Response:**
```json
{
  "driverId": 1,
  "periodType": "weekly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "metrics": [...],
  "summary": {
    "totalRides": 25,
    "totalEarnings": 450.00,
    "averageRating": 4.8,
    "averageSafetyScore": 95
  }
}
```

### Rider Analytics

```http
GET /api/analytics/rider-analytics
```

**Parameters:**
- `riderId` (required): Rider ID
- `periodType` (required): daily, weekly, monthly, yearly
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

### System Performance

```http
GET /api/analytics/system-performance
```

**Parameters:**
- `periodType` (required): hourly, daily, weekly, monthly
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

### Revenue Analytics

```http
GET /api/analytics/revenue
```

**Parameters:**
- `periodType` (required): daily, weekly, monthly, yearly
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

### Safety Analytics

```http
GET /api/analytics/safety
```

**Parameters:**
- `periodType` (required): daily, weekly, monthly, yearly
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

### Report Generation

```http
POST /api/analytics/reports
```

**Request Body:**
```json
{
  "reportType": "driver_performance",
  "filters": {
    "driverId": 1,
    "periodType": "weekly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-07"
  }
}
```

**Report Types:**
- `driver_performance`
- `revenue_analysis`
- `safety_report`
- `system_performance`

### Get Generated Reports

```http
GET /api/analytics/reports
```

**Parameters:**
- `reportType` (optional): Filter by report type
- `limit` (optional): Number of reports to return (default: 10)
- `offset` (optional): Number of reports to skip (default: 0)

### Analytics Dashboards

```http
GET /api/analytics/dashboards
```

Returns available dashboards for the authenticated user.

## Usage Examples

### Tracking Analytics Events

```javascript
const analyticsService = require('./utils/analytics');

// Track a ride request
await analyticsService.trackEvent({
  eventType: 'ride_requested',
  eventCategory: 'ride',
  userId: 123,
  userType: 'rider',
  rideId: 456,
  metadata: {
    origin: '123 Main St',
    destination: '456 Oak Ave',
    estimatedCost: 25.00
  },
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});

// Track a payment
await analyticsService.trackEvent({
  eventType: 'payment_made',
  eventCategory: 'payment',
  userId: 123,
  userType: 'rider',
  rideId: 456,
  metadata: {
    amount: 25.00,
    method: 'credit_card',
    status: 'success'
  }
});
```

### Calculating Driver Performance

```javascript
const analyticsService = require('./utils/analytics');

// Calculate weekly performance for a driver
const performance = await analyticsService.calculateDriverPerformance(
  1, // driverId
  'weekly', // periodType
  new Date('2024-01-01'), // periodStart
  new Date('2024-01-07')  // periodEnd
);

console.log('Driver Performance:', performance);
```

### Getting Dashboard Data

```javascript
const analyticsService = require('./utils/analytics');

// Get admin dashboard data
const adminData = await analyticsService.getDashboardData('admin', {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: new Date()
});

// Get driver dashboard data
const driverData = await analyticsService.getDashboardData('driver', {
  driverId: 1,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  endDate: new Date()
});
```

## Setup Instructions

### 1. Database Setup

Run the analytics schema setup script:

```bash
cd backend
node scripts/setup-analytics.js
```

This will:
- Create all analytics tables
- Set up indexes for optimal performance
- Create materialized views
- Insert sample data for testing

### 2. Environment Configuration

Ensure your database connection is properly configured in `db.js`.

### 3. API Integration

The analytics routes are automatically loaded in `server.js`. The endpoints will be available at `/api/analytics/*`.

### 4. Testing

Test the analytics endpoints using the provided sample data:

```bash
# Test driver performance analytics
curl "http://localhost:3000/api/analytics/driver-performance?driverId=1&periodType=weekly&startDate=2024-01-01&endDate=2024-01-07" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test system performance analytics
curl "http://localhost:3000/api/analytics/system-performance?periodType=daily&startDate=2024-01-01&endDate=2024-01-07" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Dashboard Types

### Admin Dashboard
- System overview metrics
- Revenue analysis
- Safety monitoring
- User growth trends

### Driver Dashboard
- Personal performance metrics
- Earnings summary
- Safety score
- Ride history

### Rider Dashboard
- Ride history
- Spending analysis
- Usage patterns
- Loyalty status

### Manager Dashboard
- Safety incident overview
- Emergency alerts
- Risk area monitoring
- Response time analysis

## Performance Optimization

### Materialized Views
The system uses materialized views for frequently accessed data:

- `daily_driver_performance`: Daily driver metrics
- `daily_system_metrics`: Daily system metrics

### Indexes
Comprehensive indexing strategy for optimal query performance:

- Event tracking indexes
- Time-based indexes
- User-specific indexes
- JSONB indexes for metadata

### Caching
Consider implementing Redis caching for:
- Frequently accessed dashboard data
- Report results
- User session analytics

## Security Considerations

### Data Privacy
- User data is anonymized where possible
- Access controls based on user roles
- Audit trails for sensitive operations

### API Security
- JWT authentication required
- Role-based access control
- Rate limiting on analytics endpoints
- Input validation and sanitization

## Monitoring and Maintenance

### Regular Tasks
1. **Refresh Materialized Views**: Run daily to keep views current
2. **Clean Old Data**: Archive old analytics data periodically
3. **Performance Monitoring**: Monitor query performance and optimize as needed
4. **Backup Analytics Data**: Include analytics tables in regular backups

### Automated Jobs
Consider setting up cron jobs for:
- Daily analytics calculations
- Materialized view refreshes
- Data cleanup and archiving
- Report generation

## Troubleshooting

### Common Issues

1. **Missing Analytics Data**
   - Check if analytics events are being tracked
   - Verify database connections
   - Ensure proper permissions

2. **Slow Query Performance**
   - Check if indexes are properly created
   - Monitor query execution plans
   - Consider adding additional indexes

3. **Permission Errors**
   - Verify JWT token validity
   - Check user role permissions
   - Ensure proper authentication headers

### Debug Mode

Enable debug logging by setting the log level in your logger configuration:

```javascript
// In logger.js
const logger = winston.createLogger({
  level: 'debug',
  // ... other configuration
});
```

## Future Enhancements

### Planned Features
1. **Real-time Analytics**: Live dashboard updates
2. **Predictive Analytics**: ML-based insights and predictions
3. **Advanced Visualizations**: Interactive charts and graphs
4. **Export Functionality**: PDF, Excel, CSV exports
5. **Custom Dashboards**: User-configurable dashboard layouts
6. **Alert System**: Automated alerts for anomalies
7. **API Rate Limiting**: Advanced rate limiting for analytics endpoints

### Integration Opportunities
1. **Business Intelligence Tools**: Connect to BI platforms
2. **Data Warehousing**: Integration with data warehouses
3. **Machine Learning**: ML model integration for predictions
4. **Third-party Analytics**: Google Analytics, Mixpanel integration

## Support

For questions or issues with the analytics system:

1. Check the API documentation at `/api-docs`
2. Review the database schema in `analytics-schema.sql`
3. Test with the provided sample data
4. Check server logs for error messages

## Contributing

When contributing to the analytics system:

1. Follow the existing code structure
2. Add comprehensive tests for new features
3. Update documentation for new endpoints
4. Ensure proper error handling
5. Follow security best practices 