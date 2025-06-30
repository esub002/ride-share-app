const pool = require('../db');
const logger = require('./logger');
const { secureQuery } = require('../middleware/database');

class AnalyticsService {
  constructor() {
    this.eventTypes = {
      RIDE: {
        REQUESTED: 'ride_requested',
        ACCEPTED: 'ride_accepted',
        STARTED: 'ride_started',
        COMPLETED: 'ride_completed',
        CANCELLED: 'ride_cancelled',
        RATED: 'ride_rated'
      },
      PAYMENT: {
        MADE: 'payment_made',
        FAILED: 'payment_failed',
        REFUNDED: 'payment_refunded'
      },
      SAFETY: {
        SOS_TRIGGERED: 'sos_triggered',
        INCIDENT_REPORTED: 'incident_reported',
        EMERGENCY_ALERT: 'emergency_alert',
        LOCATION_SHARED: 'location_shared'
      },
      USER: {
        REGISTERED: 'user_registered',
        LOGGED_IN: 'user_logged_in',
        LOGGED_OUT: 'user_logged_out',
        PROFILE_UPDATED: 'profile_updated'
      },
      SYSTEM: {
        ERROR: 'system_error',
        MAINTENANCE: 'system_maintenance',
        PERFORMANCE_ALERT: 'performance_alert'
      }
    };
  }

  /**
   * Track an analytics event
   * @param {Object} eventData - Event data
   * @param {string} eventData.eventType - Type of event
   * @param {string} eventData.eventCategory - Category of event
   * @param {number} eventData.userId - User ID
   * @param {string} eventData.userType - 'rider' or 'driver'
   * @param {number} eventData.rideId - Ride ID (optional)
   * @param {string} eventData.sessionId - Session ID (optional)
   * @param {Object} eventData.metadata - Additional event data
   * @param {string} eventData.ipAddress - IP address
   * @param {string} eventData.userAgent - User agent string
   */
  async trackEvent(eventData) {
    try {
      const {
        eventType,
        eventCategory,
        userId,
        userType,
        rideId,
        sessionId,
        metadata,
        ipAddress,
        userAgent
      } = eventData;

      const query = `
        INSERT INTO analytics_events 
        (event_type, event_category, user_id, user_type, ride_id, session_id, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;

      const values = [
        eventType,
        eventCategory,
        userId,
        userType,
        rideId,
        sessionId,
        metadata,
        ipAddress,
        userAgent
      ];

      const result = await pool.query(query, values);
      logger.info(`Analytics event tracked: ${eventType} for user ${userId}`);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Error tracking analytics event:', error);
      throw error;
    }
  }

  /**
   * Calculate driver performance metrics for a given period
   * @param {number} driverId - Driver ID
   * @param {string} periodType - 'daily', 'weekly', 'monthly', 'yearly'
   * @param {Date} periodStart - Start date
   * @param {Date} periodEnd - End date
   */
  async calculateDriverPerformance(driverId, periodType, periodStart, periodEnd) {
    try {
      // Get ride data for the period
      const ridesQuery = `
        SELECT 
          COUNT(*) as total_rides,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
          AVG(CASE WHEN status = 'completed' THEN EXTRACT(EPOCH FROM (completed_at - started_at))/60 END) as avg_duration,
          AVG(CASE WHEN status = 'completed' THEN distance END) as avg_distance,
          SUM(CASE WHEN status = 'completed' THEN distance END) as total_distance,
          AVG(CASE WHEN status = 'completed' THEN cost END) as avg_earnings,
          SUM(CASE WHEN status = 'completed' THEN cost END) as total_earnings,
          AVG(rating) as avg_rating,
          COUNT(rating) as total_ratings
        FROM rides 
        WHERE driver_id = $1 
        AND requested_at >= $2 
        AND requested_at <= $3
      `;

      const ridesResult = await pool.query(ridesQuery, [driverId, periodStart, periodEnd]);
      const rideMetrics = ridesResult.rows[0];

      // Get safety metrics
      const safetyQuery = `
        SELECT 
          COUNT(*) as safety_incidents,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_incidents
        FROM incident_reports 
        WHERE driver_id = $1 
        AND reported_at >= $2 
        AND reported_at <= $3
      `;

      const safetyResult = await pool.query(safetyQuery, [driverId, periodStart, periodEnd]);
      const safetyMetrics = safetyResult.rows[0];

      // Get emergency alerts
      const alertsQuery = `
        SELECT COUNT(*) as emergency_alerts
        FROM emergency_alerts 
        WHERE driver_id = $1 
        AND triggered_at >= $2 
        AND triggered_at <= $3
      `;

      const alertsResult = await pool.query(alertsQuery, [driverId, periodStart, periodEnd]);
      const alertMetrics = alertsResult.rows[0];

      // Calculate derived metrics
      const acceptanceRate = rideMetrics.total_rides > 0 ? 
        ((rideMetrics.total_rides - rideMetrics.cancelled_rides) / rideMetrics.total_rides) * 100 : 0;

      const safetyScore = Math.max(0, 100 - (safetyMetrics.safety_incidents * 10) - (alertMetrics.emergency_alerts * 5));

      // Insert or update performance metrics
      const upsertQuery = `
        INSERT INTO driver_performance_metrics 
        (driver_id, period_type, period_start, period_end, total_rides, completed_rides, cancelled_rides,
         average_ride_duration_minutes, total_distance_km, average_ride_distance_km, total_earnings,
         average_earnings_per_ride, average_rating, total_ratings, acceptance_rate, safety_incidents,
         safety_score, emergency_alerts)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (driver_id, period_type, period_start)
        DO UPDATE SET
          total_rides = EXCLUDED.total_rides,
          completed_rides = EXCLUDED.completed_rides,
          cancelled_rides = EXCLUDED.cancelled_rides,
          average_ride_duration_minutes = EXCLUDED.average_ride_duration_minutes,
          total_distance_km = EXCLUDED.total_distance_km,
          average_ride_distance_km = EXCLUDED.average_ride_distance_km,
          total_earnings = EXCLUDED.total_earnings,
          average_earnings_per_ride = EXCLUDED.average_earnings_per_ride,
          average_rating = EXCLUDED.average_rating,
          total_ratings = EXCLUDED.total_ratings,
          acceptance_rate = EXCLUDED.acceptance_rate,
          safety_incidents = EXCLUDED.safety_incidents,
          safety_score = EXCLUDED.safety_score,
          emergency_alerts = EXCLUDED.emergency_alerts,
          updated_at = NOW()
        RETURNING *
      `;

      const values = [
        driverId, periodType, periodStart, periodEnd,
        parseInt(rideMetrics.total_rides) || 0,
        parseInt(rideMetrics.completed_rides) || 0,
        parseInt(rideMetrics.cancelled_rides) || 0,
        parseFloat(rideMetrics.avg_duration) || 0,
        parseFloat(rideMetrics.total_distance) || 0,
        parseFloat(rideMetrics.avg_distance) || 0,
        parseFloat(rideMetrics.total_earnings) || 0,
        parseFloat(rideMetrics.avg_earnings) || 0,
        parseFloat(rideMetrics.avg_rating) || 0,
        parseInt(rideMetrics.total_ratings) || 0,
        parseFloat(acceptanceRate),
        parseInt(safetyMetrics.safety_incidents) || 0,
        parseInt(safetyScore),
        parseInt(alertMetrics.emergency_alerts) || 0
      ];

      const result = await pool.query(upsertQuery, values);
      logger.info(`Driver performance calculated for driver ${driverId}, period ${periodType}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error calculating driver performance:', error);
      throw error;
    }
  }

  /**
   * Calculate rider analytics for a given period
   * @param {number} riderId - Rider ID
   * @param {string} periodType - 'daily', 'weekly', 'monthly', 'yearly'
   * @param {Date} periodStart - Start date
   * @param {Date} periodEnd - End date
   */
  async calculateRiderAnalytics(riderId, periodType, periodStart, periodEnd) {
    try {
      // Get ride data for the period
      const ridesQuery = `
        SELECT 
          COUNT(*) as total_rides,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
          AVG(CASE WHEN status = 'completed' THEN cost END) as avg_cost,
          SUM(CASE WHEN status = 'completed' THEN cost END) as total_spent,
          AVG(CASE WHEN status = 'completed' THEN distance END) as avg_distance
        FROM rides 
        WHERE rider_id = $1 
        AND requested_at >= $2 
        AND requested_at <= $3
      `;

      const ridesResult = await pool.query(ridesQuery, [riderId, periodStart, periodEnd]);
      const rideMetrics = ridesResult.rows[0];

      // Get usage patterns (hourly distribution)
      const usageQuery = `
        SELECT 
          EXTRACT(HOUR FROM requested_at) as hour,
          COUNT(*) as ride_count
        FROM rides 
        WHERE rider_id = $1 
        AND requested_at >= $2 
        AND requested_at <= $3
        GROUP BY EXTRACT(HOUR FROM requested_at)
        ORDER BY hour
      `;

      const usageResult = await pool.query(usageQuery, [riderId, periodStart, periodEnd]);
      const peakUsageHours = usageResult.rows.reduce((acc, row) => {
        acc[row.hour] = parseInt(row.ride_count);
        return acc;
      }, {});

      // Calculate days since last ride
      const lastRideQuery = `
        SELECT MAX(requested_at) as last_ride_date
        FROM rides 
        WHERE rider_id = $1 AND status = 'completed'
      `;

      const lastRideResult = await pool.query(lastRideQuery, [riderId]);
      const daysSinceLastRide = lastRideResult.rows[0].last_ride_date ? 
        Math.floor((new Date() - new Date(lastRideResult.rows[0].last_ride_date)) / (1000 * 60 * 60 * 24)) : null;

      // Insert or update rider analytics
      const upsertQuery = `
        INSERT INTO rider_analytics 
        (rider_id, period_type, period_start, period_end, total_rides, completed_rides, cancelled_rides,
         average_ride_cost, total_spent, average_ride_distance_km, peak_usage_hours, days_since_last_ride)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (rider_id, period_type, period_start)
        DO UPDATE SET
          total_rides = EXCLUDED.total_rides,
          completed_rides = EXCLUDED.completed_rides,
          cancelled_rides = EXCLUDED.cancelled_rides,
          average_ride_cost = EXCLUDED.average_ride_cost,
          total_spent = EXCLUDED.total_spent,
          average_ride_distance_km = EXCLUDED.average_ride_distance_km,
          peak_usage_hours = EXCLUDED.peak_usage_hours,
          days_since_last_ride = EXCLUDED.days_since_last_ride,
          updated_at = NOW()
        RETURNING *
      `;

      const values = [
        riderId, periodType, periodStart, periodEnd,
        parseInt(rideMetrics.total_rides) || 0,
        parseInt(rideMetrics.completed_rides) || 0,
        parseInt(rideMetrics.cancelled_rides) || 0,
        parseFloat(rideMetrics.avg_cost) || 0,
        parseFloat(rideMetrics.total_spent) || 0,
        parseFloat(rideMetrics.avg_distance) || 0,
        JSON.stringify(peakUsageHours),
        daysSinceLastRide
      ];

      const result = await pool.query(upsertQuery, values);
      logger.info(`Rider analytics calculated for rider ${riderId}, period ${periodType}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error calculating rider analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate system performance metrics for a given period
   * @param {string} periodType - 'hourly', 'daily', 'weekly', 'monthly'
   * @param {Date} periodStart - Start date
   * @param {Date} periodEnd - End date
   */
  async calculateSystemPerformance(periodType, periodStart, periodEnd) {
    try {
      // Get platform metrics
      const platformQuery = `
        SELECT 
          COUNT(*) as total_rides,
          COUNT(DISTINCT driver_id) as active_drivers,
          COUNT(DISTINCT rider_id) as active_riders,
          AVG(CASE WHEN status = 'completed' THEN EXTRACT(EPOCH FROM (accepted_at - requested_at)) * 1000 END) as avg_response_time_ms
        FROM rides 
        WHERE requested_at >= $1 AND requested_at <= $2
      `;

      const platformResult = await pool.query(platformQuery, [periodStart, periodEnd]);
      const platformMetrics = platformResult.rows[0];

      // Get new registrations
      const registrationsQuery = `
        SELECT 
          COUNT(*) as new_registrations
        FROM (
          SELECT id FROM users WHERE created_at >= $1 AND created_at <= $2
          UNION ALL
          SELECT id FROM drivers WHERE created_at >= $1 AND created_at <= $2
        ) as all_users
      `;

      const registrationsResult = await pool.query(registrationsQuery, [periodStart, periodEnd]);
      const registrationMetrics = registrationsResult.rows[0];

      // Get safety metrics
      const safetyQuery = `
        SELECT 
          COUNT(*) as safety_incidents,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_incidents
        FROM incident_reports 
        WHERE reported_at >= $1 AND reported_at <= $2
      `;

      const safetyResult = await pool.query(safetyQuery, [periodStart, periodEnd]);
      const safetyMetrics = safetyResult.rows[0];

      // Get emergency alerts
      const alertsQuery = `
        SELECT COUNT(*) as emergency_alerts
        FROM emergency_alerts 
        WHERE triggered_at >= $1 AND triggered_at <= $2
      `;

      const alertsResult = await pool.query(alertsQuery, [periodStart, periodEnd]);
      const alertMetrics = alertsResult.rows[0];

      // Insert or update system performance metrics
      const upsertQuery = `
        INSERT INTO system_performance_metrics 
        (period_type, period_start, period_end, total_rides, active_drivers, active_riders,
         new_registrations, average_response_time_ms, safety_incidents, emergency_alerts, resolved_incidents)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (period_type, period_start)
        DO UPDATE SET
          total_rides = EXCLUDED.total_rides,
          active_drivers = EXCLUDED.active_drivers,
          active_riders = EXCLUDED.active_riders,
          new_registrations = EXCLUDED.new_registrations,
          average_response_time_ms = EXCLUDED.average_response_time_ms,
          safety_incidents = EXCLUDED.safety_incidents,
          emergency_alerts = EXCLUDED.emergency_alerts,
          resolved_incidents = EXCLUDED.resolved_incidents
        RETURNING *
      `;

      const values = [
        periodType, periodStart, periodEnd,
        parseInt(platformMetrics.total_rides) || 0,
        parseInt(platformMetrics.active_drivers) || 0,
        parseInt(platformMetrics.active_riders) || 0,
        parseInt(registrationMetrics.new_registrations) || 0,
        parseInt(platformMetrics.avg_response_time_ms) || 0,
        parseInt(safetyMetrics.safety_incidents) || 0,
        parseInt(alertMetrics.emergency_alerts) || 0,
        parseInt(safetyMetrics.resolved_incidents) || 0
      ];

      const result = await pool.query(upsertQuery, values);
      logger.info(`System performance calculated for period ${periodType}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error calculating system performance:', error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive analytics report
   * @param {string} reportType - Type of report to generate
   * @param {Object} filters - Report filters
   * @param {number} generatedBy - User ID who generated the report
   */
  async generateReport(reportType, filters, generatedBy) {
    try {
      let reportData = {};
      const reportName = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;

      switch (reportType) {
        case 'driver_performance':
          reportData = await this.generateDriverPerformanceReport(filters);
          break;
        case 'revenue_analysis':
          reportData = await this.generateRevenueReport(filters);
          break;
        case 'safety_report':
          reportData = await this.generateSafetyReport(filters);
          break;
        case 'system_performance':
          reportData = await this.generateSystemPerformanceReport(filters);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      // Store the report
      const insertQuery = `
        INSERT INTO analytics_reports 
        (report_type, report_name, generated_by, report_period, report_data, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        reportType,
        reportName,
        generatedBy,
        JSON.stringify(filters),
        JSON.stringify(reportData),
        'completed'
      ];

      const result = await pool.query(insertQuery, values);
      logger.info(`Report generated: ${reportType} by user ${generatedBy}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Generate driver performance report
   */
  async generateDriverPerformanceReport(filters) {
    const { driverId, periodType, startDate, endDate } = filters;
    
    const query = `
      SELECT * FROM driver_performance_metrics 
      WHERE driver_id = $1 
      AND period_type = $2 
      AND period_start >= $3 
      AND period_end <= $4
      ORDER BY period_start DESC
    `;

    const result = await pool.query(query, [driverId, periodType, startDate, endDate]);
    return {
      driverId,
      periodType,
      startDate,
      endDate,
      metrics: result.rows,
      summary: this.calculateDriverSummary(result.rows)
    };
  }

  /**
   * Calculate driver performance summary
   */
  calculateDriverSummary(metrics) {
    if (!metrics || metrics.length === 0) return {};

    const totalRides = metrics.reduce((sum, m) => sum + parseInt(m.total_rides), 0);
    const totalEarnings = metrics.reduce((sum, m) => sum + parseFloat(m.total_earnings), 0);
    const avgRating = metrics.reduce((sum, m) => sum + parseFloat(m.average_rating || 0), 0) / metrics.length;
    const avgSafetyScore = metrics.reduce((sum, m) => sum + parseInt(m.safety_score), 0) / metrics.length;

    return {
      totalRides,
      totalEarnings,
      averageRating: parseFloat(avgRating.toFixed(2)),
      averageSafetyScore: parseInt(avgSafetyScore),
      totalPeriods: metrics.length
    };
  }

  /**
   * Generate revenue report
   */
  async generateRevenueReport(filters) {
    const { periodType, startDate, endDate } = filters;
    
    const query = `
      SELECT * FROM revenue_analytics 
      WHERE period_type = $1 
      AND period_start >= $2 
      AND period_end <= $3
      ORDER BY period_start DESC
    `;

    const result = await pool.query(query, [periodType, startDate, endDate]);
    return {
      periodType,
      startDate,
      endDate,
      revenue: result.rows,
      summary: this.calculateRevenueSummary(result.rows)
    };
  }

  /**
   * Calculate revenue summary
   */
  calculateRevenueSummary(revenue) {
    if (!revenue || revenue.length === 0) return {};

    const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.gross_revenue), 0);
    const totalTransactions = revenue.reduce((sum, r) => sum + parseInt(r.total_transactions), 0);
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue: parseFloat(avgTransactionValue.toFixed(2)),
      totalPeriods: revenue.length
    };
  }

  /**
   * Generate safety report
   */
  async generateSafetyReport(filters) {
    const { periodType, startDate, endDate } = filters;
    
    const query = `
      SELECT * FROM safety_analytics 
      WHERE period_type = $1 
      AND period_start >= $2 
      AND period_end <= $3
      ORDER BY period_start DESC
    `;

    const result = await pool.query(query, [periodType, startDate, endDate]);
    return {
      periodType,
      startDate,
      endDate,
      safety: result.rows,
      summary: this.calculateSafetySummary(result.rows)
    };
  }

  /**
   * Calculate safety summary
   */
  calculateSafetySummary(safety) {
    if (!safety || safety.length === 0) return {};

    const totalIncidents = safety.reduce((sum, s) => sum + parseInt(s.total_incidents), 0);
    const totalAlerts = safety.reduce((sum, s) => sum + parseInt(s.emergency_alerts), 0);
    const avgResponseTime = safety.reduce((sum, s) => sum + parseInt(s.average_response_time_seconds || 0), 0) / safety.length;

    return {
      totalIncidents,
      totalAlerts,
      averageResponseTime: parseInt(avgResponseTime),
      totalPeriods: safety.length
    };
  }

  /**
   * Generate system performance report
   */
  async generateSystemPerformanceReport(filters) {
    const { periodType, startDate, endDate } = filters;
    
    const query = `
      SELECT * FROM system_performance_metrics 
      WHERE period_type = $1 
      AND period_start >= $2 
      AND period_end <= $3
      ORDER BY period_start DESC
    `;

    const result = await pool.query(query, [periodType, startDate, endDate]);
    return {
      periodType,
      startDate,
      endDate,
      performance: result.rows,
      summary: this.calculateSystemSummary(result.rows)
    };
  }

  /**
   * Calculate system performance summary
   */
  calculateSystemSummary(performance) {
    if (!performance || performance.length === 0) return {};

    const totalRides = performance.reduce((sum, p) => sum + parseInt(p.total_rides), 0);
    const avgActiveDrivers = performance.reduce((sum, p) => sum + parseInt(p.active_drivers), 0) / performance.length;
    const avgResponseTime = performance.reduce((sum, p) => sum + parseInt(p.average_response_time_ms || 0), 0) / performance.length;

    return {
      totalRides,
      averageActiveDrivers: parseInt(avgActiveDrivers),
      averageResponseTime: parseInt(avgResponseTime),
      totalPeriods: performance.length
    };
  }

  /**
   * Refresh materialized views
   */
  async refreshViews() {
    try {
      await pool.query('SELECT refresh_analytics_views()');
      logger.info('Analytics views refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing analytics views:', error);
      throw error;
    }
  }

  /**
   * Get analytics dashboard data
   * @param {string} dashboardType - Type of dashboard
   * @param {Object} filters - Dashboard filters
   */
  async getDashboardData(dashboardType, filters = {}) {
    try {
      switch (dashboardType) {
        case 'admin':
          return await this.getAdminDashboardData(filters);
        case 'driver':
          return await this.getDriverDashboardData(filters);
        case 'rider':
          return await this.getRiderDashboardData(filters);
        case 'manager':
          return await this.getManagerDashboardData(filters);
        default:
          throw new Error(`Unknown dashboard type: ${dashboardType}`);
      }
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get admin dashboard data
   */
  async getAdminDashboardData(filters) {
    const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = filters;

    // Get system overview
    const systemQuery = `
      SELECT 
        COUNT(*) as total_rides,
        COUNT(DISTINCT driver_id) as active_drivers,
        COUNT(DISTINCT rider_id) as active_riders,
        AVG(CASE WHEN status = 'completed' THEN cost END) as avg_ride_cost
      FROM rides 
      WHERE requested_at >= $1 AND requested_at <= $2
    `;

    const systemResult = await pool.query(systemQuery, [startDate, endDate]);

    // Get revenue data
    const revenueQuery = `
      SELECT 
        SUM(cost) as total_revenue,
        COUNT(*) as total_transactions
      FROM rides 
      WHERE status = 'completed' 
      AND requested_at >= $1 AND requested_at <= $2
    `;

    const revenueResult = await pool.query(revenueQuery, [startDate, endDate]);

    // Get safety data
    const safetyQuery = `
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_incidents
      FROM incident_reports 
      WHERE reported_at >= $1 AND reported_at <= $2
    `;

    const safetyResult = await pool.query(safetyQuery, [startDate, endDate]);

    return {
      system: systemResult.rows[0],
      revenue: revenueResult.rows[0],
      safety: safetyResult.rows[0],
      period: { startDate, endDate }
    };
  }

  /**
   * Get driver dashboard data
   */
  async getDriverDashboardData(filters) {
    const { driverId, startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate = new Date() } = filters;

    if (!driverId) {
      throw new Error('Driver ID required for driver dashboard');
    }

    // Get driver performance
    const performanceQuery = `
      SELECT 
        COUNT(*) as total_rides,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
        SUM(CASE WHEN status = 'completed' THEN cost END) as total_earnings,
        AVG(rating) as average_rating
      FROM rides 
      WHERE driver_id = $1 
      AND requested_at >= $2 AND requested_at <= $3
    `;

    const performanceResult = await pool.query(performanceQuery, [driverId, startDate, endDate]);

    // Get safety metrics
    const safetyQuery = `
      SELECT 
        safety_score,
        COUNT(*) as safety_incidents
      FROM safety_metrics 
      WHERE driver_id = $1
    `;

    const safetyResult = await pool.query(safetyQuery, [driverId]);

    return {
      performance: performanceResult.rows[0],
      safety: safetyResult.rows[0] || { safety_score: 100, safety_incidents: 0 },
      period: { startDate, endDate }
    };
  }

  /**
   * Get rider dashboard data
   */
  async getRiderDashboardData(filters) {
    const { riderId, startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = filters;

    if (!riderId) {
      throw new Error('Rider ID required for rider dashboard');
    }

    // Get ride history
    const ridesQuery = `
      SELECT 
        COUNT(*) as total_rides,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
        SUM(CASE WHEN status = 'completed' THEN cost END) as total_spent,
        AVG(CASE WHEN status = 'completed' THEN cost END) as avg_ride_cost
      FROM rides 
      WHERE rider_id = $1 
      AND requested_at >= $2 AND requested_at <= $3
    `;

    const ridesResult = await pool.query(ridesQuery, [riderId, startDate, endDate]);

    return {
      rides: ridesResult.rows[0],
      period: { startDate, endDate }
    };
  }

  /**
   * Get manager dashboard data
   */
  async getManagerDashboardData(filters) {
    const { startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate = new Date() } = filters;

    // Get safety overview
    const safetyQuery = `
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_incidents,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_incidents
      FROM incident_reports 
      WHERE reported_at >= $1 AND reported_at <= $2
    `;

    const safetyResult = await pool.query(safetyQuery, [startDate, endDate]);

    // Get emergency alerts
    const alertsQuery = `
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN alert_type = 'sos' THEN 1 END) as sos_alerts,
        COUNT(CASE WHEN alert_type = 'panic' THEN 1 END) as panic_alerts
      FROM emergency_alerts 
      WHERE triggered_at >= $1 AND triggered_at <= $2
    `;

    const alertsResult = await pool.query(alertsQuery, [startDate, endDate]);

    return {
      safety: safetyResult.rows[0],
      alerts: alertsResult.rows[0],
      period: { startDate, endDate }
    };
  }
}

/**
 * Analytics Processing Utility
 * Processes analytics events and stores them in the database
 */

/**
 * Process analytics event
 * @param {Object} eventData - The analytics event data
 */
async function processAnalyticsEvent(eventData) {
  try {
    const { event, userId, data, timestamp = new Date() } = eventData;
    
    // Store analytics event in database
    await secureQuery(
      'INSERT INTO analytics_events (event_type, user_id, event_data, created_at) VALUES ($1, $2, $3, $4)',
      [event, userId, JSON.stringify(data), timestamp]
    );
    
    // Process specific event types
    switch (event) {
      case 'ride_completed':
        await processRideCompletedEvent(eventData);
        break;
      case 'user_registered':
        await processUserRegisteredEvent(eventData);
        break;
      case 'driver_online':
        await processDriverOnlineEvent(eventData);
        break;
      default:
        logger.debug('Analytics event processed', { event, userId });
    }
    
    logger.info('Analytics event processed successfully', { event, userId });
  } catch (error) {
    logger.error('Failed to process analytics event', { error: error.message, eventData });
    throw error;
  }
}

/**
 * Process ride completed event
 */
async function processRideCompletedEvent(eventData) {
  const { rideId, fare, distance, duration } = eventData.data;
  
  // Update ride statistics
  await secureQuery(
    'UPDATE rides SET completed_at = NOW(), actual_fare = $1, distance = $2, duration = $3 WHERE id = $4',
    [fare, distance, duration, rideId]
  );
  
  // Update driver earnings
  if (eventData.driverId) {
    await secureQuery(
      'UPDATE drivers SET total_earnings = total_earnings + $1, total_rides = total_rides + 1 WHERE id = $2',
      [fare, eventData.driverId]
    );
  }
}

/**
 * Process user registered event
 */
async function processUserRegisteredEvent(eventData) {
  const { userId, registrationMethod } = eventData.data;
  
  // Update user registration analytics
  await secureQuery(
    'INSERT INTO user_analytics (user_id, registration_method, registration_date) VALUES ($1, $2, NOW())',
    [userId, registrationMethod || 'email']
  );
}

/**
 * Process driver online event
 */
async function processDriverOnlineEvent(eventData) {
  const { driverId, location } = eventData.data;
  
  // Update driver availability
  await secureQuery(
    'UPDATE drivers SET available = TRUE, last_online = NOW(), latitude = $1, longitude = $2 WHERE id = $3',
    [location?.latitude, location?.longitude, driverId]
  );
}

/**
 * Get analytics summary
 */
async function getAnalyticsSummary() {
  try {
    const summary = await secureQuery(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN event_type = 'ride_completed' THEN 1 END) as completed_rides,
        COUNT(CASE WHEN event_type = 'user_registered' THEN 1 END) as new_users
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    
    return summary.rows[0];
  } catch (error) {
    logger.error('Failed to get analytics summary', { error: error.message });
    throw error;
  }
}

module.exports = {
  processAnalyticsEvent,
  getAnalyticsSummary
}; 