const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/analytics/driver-performance:
 *   get:
 *     summary: Get driver performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Driver ID
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         required: true
 *         description: Period type for analytics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Driver performance data
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/driver-performance', auth('driver'), async (req, res) => {
  try {
    const { driverId, periodType, startDate, endDate } = req.query;
    
    if (!driverId || !periodType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if user is requesting their own data or is admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(driverId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT * FROM driver_performance_metrics 
      WHERE driver_id = $1 
      AND period_type = $2 
      AND period_start >= $3 
      AND period_end <= $4
      ORDER BY period_start DESC
    `;

    const { rows } = await pool.query(query, [driverId, periodType, startDate, endDate]);

    // Calculate summary statistics
    const summary = {
      totalRides: rows.reduce((sum, row) => sum + parseInt(row.total_rides), 0),
      totalEarnings: rows.reduce((sum, row) => sum + parseFloat(row.total_earnings), 0),
      averageRating: rows.length > 0 ? 
        rows.reduce((sum, row) => sum + parseFloat(row.average_rating || 0), 0) / rows.length : 0,
      averageSafetyScore: rows.length > 0 ? 
        rows.reduce((sum, row) => sum + parseInt(row.safety_score), 0) / rows.length : 100,
      totalPeriods: rows.length
    };

    res.json({
      driverId: parseInt(driverId),
      periodType,
      startDate,
      endDate,
      metrics: rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching driver performance:', error);
    res.status(500).json({ error: 'Failed to fetch driver performance data' });
  }
});

/**
 * @swagger
 * /api/analytics/rider-analytics:
 *   get:
 *     summary: Get rider analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: riderId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Rider ID
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         required: true
 *         description: Period type for analytics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Rider analytics data
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/rider-analytics', auth('user'), async (req, res) => {
  try {
    const { riderId, periodType, startDate, endDate } = req.query;
    
    if (!riderId || !periodType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if user is requesting their own data or is admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(riderId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT * FROM rider_analytics 
      WHERE rider_id = $1 
      AND period_type = $2 
      AND period_start >= $3 
      AND period_end <= $4
      ORDER BY period_start DESC
    `;

    const { rows } = await pool.query(query, [riderId, periodType, startDate, endDate]);

    // Calculate summary statistics
    const summary = {
      totalRides: rows.reduce((sum, row) => sum + parseInt(row.total_rides), 0),
      totalSpent: rows.reduce((sum, row) => sum + parseFloat(row.total_spent), 0),
      averageRideCost: rows.length > 0 ? 
        rows.reduce((sum, row) => sum + parseFloat(row.average_ride_cost), 0) / rows.length : 0,
      totalPeriods: rows.length
    };

    res.json({
      riderId: parseInt(riderId),
      periodType,
      startDate,
      endDate,
      analytics: rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching rider analytics:', error);
    res.status(500).json({ error: 'Failed to fetch rider analytics data' });
  }
});

/**
 * @swagger
 * /api/analytics/system-performance:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly]
 *         required: true
 *         description: Period type for analytics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: System performance data
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/system-performance', auth('admin'), async (req, res) => {
  try {
    const { periodType, startDate, endDate } = req.query;
    
    if (!periodType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const query = `
      SELECT * FROM system_performance_metrics 
      WHERE period_type = $1 
      AND period_start >= $2 
      AND period_end <= $3
      ORDER BY period_start DESC
    `;

    const { rows } = await pool.query(query, [periodType, startDate, endDate]);

    // Calculate summary statistics
    const summary = {
      totalRides: rows.reduce((sum, row) => sum + parseInt(row.total_rides), 0),
      averageActiveDrivers: rows.length > 0 ? 
        rows.reduce((sum, row) => sum + parseInt(row.active_drivers), 0) / rows.length : 0,
      averageResponseTime: rows.length > 0 ? 
        rows.reduce((sum, row) => sum + parseInt(row.average_response_time_ms || 0), 0) / rows.length : 0,
      totalPeriods: rows.length
    };

    res.json({
      periodType,
      startDate,
      endDate,
      performance: rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching system performance:', error);
    res.status(500).json({ error: 'Failed to fetch system performance data' });
  }
});

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         required: true
 *         description: Period type for analytics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue analytics data
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/revenue', auth('admin'), async (req, res) => {
  try {
    const { periodType, startDate, endDate } = req.query;
    
    if (!periodType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const query = `
      SELECT * FROM revenue_analytics 
      WHERE period_type = $1 
      AND period_start >= $2 
      AND period_end <= $3
      ORDER BY period_start DESC
    `;

    const { rows } = await pool.query(query, [periodType, startDate, endDate]);

    // Calculate summary statistics
    const summary = {
      totalRevenue: rows.reduce((sum, row) => sum + parseFloat(row.gross_revenue), 0),
      totalTransactions: rows.reduce((sum, row) => sum + parseInt(row.total_transactions), 0),
      averageTransactionValue: rows.length > 0 ? 
        rows.reduce((sum, row) => sum + parseFloat(row.average_transaction_value), 0) / rows.length : 0,
      totalPeriods: rows.length
    };

    res.json({
      periodType,
      startDate,
      endDate,
      revenue: rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics data' });
  }
});

/**
 * @swagger
 * /api/analytics/safety:
 *   get:
 *     summary: Get safety analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         required: true
 *         description: Period type for analytics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Safety analytics data
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/safety', auth('admin'), async (req, res) => {
  try {
    const { periodType, startDate, endDate } = req.query;
    
    if (!periodType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const query = `
      SELECT * FROM safety_analytics 
      WHERE period_type = $1 
      AND period_start >= $2 
      AND period_end <= $3
      ORDER BY period_start DESC
    `;

    const { rows } = await pool.query(query, [periodType, startDate, endDate]);

    // Calculate summary statistics
    const summary = {
      totalIncidents: rows.reduce((sum, row) => sum + parseInt(row.total_incidents), 0),
      totalAlerts: rows.reduce((sum, row) => sum + parseInt(row.emergency_alerts), 0),
      averageResponseTime: rows.length > 0 ? 
        rows.reduce((sum, row) => sum + parseInt(row.average_response_time_seconds || 0), 0) / rows.length : 0,
      totalPeriods: rows.length
    };

    res.json({
      periodType,
      startDate,
      endDate,
      safety: rows,
      summary
    });
  } catch (error) {
    console.error('Error fetching safety analytics:', error);
    res.status(500).json({ error: 'Failed to fetch safety analytics data' });
  }
});

/**
 * @swagger
 * /api/analytics/reports:
 *   post:
 *     summary: Generate analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - filters
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [driver_performance, revenue_analysis, safety_report, system_performance]
 *               filters:
 *                 type: object
 *                 properties:
 *                   driverId:
 *                     type: integer
 *                   riderId:
 *                     type: integer
 *                   periodType:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *     responses:
 *       201:
 *         description: Report generated successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.post('/reports', auth(), async (req, res) => {
  try {
    const { reportType, filters } = req.body;
    
    if (!reportType || !filters) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate report type
    const validReportTypes = ['driver_performance', 'revenue_analysis', 'safety_report', 'system_performance'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Check permissions based on report type
    if (reportType === 'revenue_analysis' || reportType === 'safety_report' || reportType === 'system_performance') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Generate report data based on type
    let reportData = {};
    const reportName = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;

    switch (reportType) {
      case 'driver_performance':
        if (!filters.driverId) {
          return res.status(400).json({ error: 'Driver ID required for driver performance report' });
        }
        reportData = await generateDriverPerformanceReport(filters);
        break;
      case 'revenue_analysis':
        reportData = await generateRevenueReport(filters);
        break;
      case 'safety_report':
        reportData = await generateSafetyReport(filters);
        break;
      case 'system_performance':
        reportData = await generateSystemPerformanceReport(filters);
        break;
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
      req.user.id,
      JSON.stringify(filters),
      JSON.stringify(reportData),
      'completed'
    ];

    const result = await pool.query(insertQuery, values);
    
    res.status(201).json({
      message: 'Report generated successfully',
      report: result.rows[0]
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * @swagger
 * /api/analytics/reports:
 *   get:
 *     summary: Get generated reports
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *         description: Filter by report type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reports to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of reports to skip
 *     responses:
 *       200:
 *         description: List of reports
 *       401:
 *         description: Unauthorized
 */
router.get('/reports', auth(), async (req, res) => {
  try {
    const { reportType, limit = 10, offset = 0 } = req.query;
    
    let query = `
      SELECT * FROM analytics_reports 
      WHERE generated_by = $1
    `;
    let values = [req.user.id];
    let paramCount = 1;

    if (reportType) {
      paramCount++;
      query += ` AND report_type = $${paramCount}`;
      values.push(reportType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(parseInt(limit), parseInt(offset));

    const { rows } = await pool.query(query, values);
    
    res.json({
      reports: rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * @swagger
 * /api/analytics/dashboards:
 *   get:
 *     summary: Get analytics dashboards
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dashboards
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboards', auth(), async (req, res) => {
  try {
    const query = `
      SELECT * FROM analytics_dashboards 
      WHERE is_public = true OR created_by = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query, [req.user.id]);
    
    res.json({
      dashboards: rows
    });
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

// Helper functions for report generation
async function generateDriverPerformanceReport(filters) {
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
  
  const summary = {
    totalRides: result.rows.reduce((sum, row) => sum + parseInt(row.total_rides), 0),
    totalEarnings: result.rows.reduce((sum, row) => sum + parseFloat(row.total_earnings), 0),
    averageRating: result.rows.length > 0 ? 
      result.rows.reduce((sum, row) => sum + parseFloat(row.average_rating || 0), 0) / result.rows.length : 0,
    averageSafetyScore: result.rows.length > 0 ? 
      result.rows.reduce((sum, row) => sum + parseInt(row.safety_score), 0) / result.rows.length : 100
  };

  return {
    driverId,
    periodType,
    startDate,
    endDate,
    metrics: result.rows,
    summary
  };
}

async function generateRevenueReport(filters) {
  const { periodType, startDate, endDate } = filters;
  
  const query = `
    SELECT * FROM revenue_analytics 
    WHERE period_type = $1 
    AND period_start >= $2 
    AND period_end <= $3
    ORDER BY period_start DESC
  `;

  const result = await pool.query(query, [periodType, startDate, endDate]);
  
  const summary = {
    totalRevenue: result.rows.reduce((sum, row) => sum + parseFloat(row.gross_revenue), 0),
    totalTransactions: result.rows.reduce((sum, row) => sum + parseInt(row.total_transactions), 0),
    averageTransactionValue: result.rows.length > 0 ? 
      result.rows.reduce((sum, row) => sum + parseFloat(row.average_transaction_value), 0) / result.rows.length : 0
  };

  return {
    periodType,
    startDate,
    endDate,
    revenue: result.rows,
    summary
  };
}

async function generateSafetyReport(filters) {
  const { periodType, startDate, endDate } = filters;
  
  const query = `
    SELECT * FROM safety_analytics 
    WHERE period_type = $1 
    AND period_start >= $2 
    AND period_end <= $3
    ORDER BY period_start DESC
  `;

  const result = await pool.query(query, [periodType, startDate, endDate]);
  
  const summary = {
    totalIncidents: result.rows.reduce((sum, row) => sum + parseInt(row.total_incidents), 0),
    totalAlerts: result.rows.reduce((sum, row) => sum + parseInt(row.emergency_alerts), 0),
    averageResponseTime: result.rows.length > 0 ? 
      result.rows.reduce((sum, row) => sum + parseInt(row.average_response_time_seconds || 0), 0) / result.rows.length : 0
  };

  return {
    periodType,
    startDate,
    endDate,
    safety: result.rows,
    summary
  };
}

async function generateSystemPerformanceReport(filters) {
  const { periodType, startDate, endDate } = filters;
  
  const query = `
    SELECT * FROM system_performance_metrics 
    WHERE period_type = $1 
    AND period_start >= $2 
    AND period_end <= $3
    ORDER BY period_start DESC
  `;

  const result = await pool.query(query, [periodType, startDate, endDate]);
  
  const summary = {
    totalRides: result.rows.reduce((sum, row) => sum + parseInt(row.total_rides), 0),
    averageActiveDrivers: result.rows.length > 0 ? 
      result.rows.reduce((sum, row) => sum + parseInt(row.active_drivers), 0) / result.rows.length : 0,
    averageResponseTime: result.rows.length > 0 ? 
      result.rows.reduce((sum, row) => sum + parseInt(row.average_response_time_ms || 0), 0) / result.rows.length : 0
  };

  return {
    periodType,
    startDate,
    endDate,
    performance: result.rows,
    summary
  };
}

module.exports = router;
