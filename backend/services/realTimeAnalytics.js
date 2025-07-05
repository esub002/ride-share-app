/**
 * Real-Time Analytics Service
 * Provides live metrics, performance monitoring, and business intelligence
 */

const { EventEmitter } = require('events');
const { logEvent } = require('../utils/log');
const { secureQuery } = require('../middleware/database');

class RealTimeAnalytics extends EventEmitter {
  constructor(socketService) {
    super();
    this.socketService = socketService;
    this.metrics = {
      activeRides: 0,
      availableDrivers: 0,
      activeRiders: 0,
      totalRevenue: 0,
      averageWaitTime: 0,
      completionRate: 0,
      safetyIncidents: 0,
      systemHealth: 'healthy'
    };
    this.historicalData = {
      rides: [],
      revenue: [],
      performance: []
    };
    this.alerts = [];
    this.updateInterval = null;
    this.initialize();
  }

  async initialize() {
    console.log('📊 Initializing Real-Time Analytics Service...');
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Setup real-time event listeners
    this.setupEventListeners();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    console.log('✅ Real-Time Analytics Service initialized');
  }

  setupEventListeners() {
    // Listen to socket service events
    this.socketService.on('ride:created', () => this.updateRideMetrics());
    this.socketService.on('ride:completed', () => this.updateRideMetrics());
    this.socketService.on('driver:available', () => this.updateDriverMetrics());
    this.socketService.on('driver:unavailable', () => this.updateDriverMetrics());
    this.socketService.on('emergency:alert', () => this.updateSafetyMetrics());
  }

  startMetricsCollection() {
    // Collect initial metrics
    this.collectMetrics();
    
    // Update metrics every 30 seconds
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  async collectMetrics() {
    try {
      const [
        activeRides,
        availableDrivers,
        activeRiders,
        totalRevenue,
        averageWaitTime,
        completionRate,
        safetyIncidents
      ] = await Promise.all([
        this.getActiveRidesCount(),
        this.getAvailableDriversCount(),
        this.getActiveRidersCount(),
        this.getTotalRevenue(),
        this.getAverageWaitTime(),
        this.getCompletionRate(),
        this.getSafetyIncidentsCount()
      ]);

      const previousMetrics = { ...this.metrics };
      
      this.metrics = {
        activeRides,
        availableDrivers,
        activeRiders,
        totalRevenue,
        averageWaitTime,
        completionRate,
        safetyIncidents,
        systemHealth: this.calculateSystemHealth()
      };

      // Check for significant changes and emit alerts
      this.checkForAlerts(previousMetrics, this.metrics);
      
      // Store historical data
      this.storeHistoricalData();
      
      // Broadcast updates to connected clients
      this.broadcastMetrics();
      
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
      this.metrics.systemHealth = 'degraded';
    }
  }

  async getActiveRidesCount() {
    try {
      const result = await secureQuery(
        'SELECT COUNT(*) as count FROM rides WHERE status IN ($1, $2, $3)',
        ['accepted', 'in_progress', 'pickup']
      );
      return parseInt(result.rows[0]?.count || 0);
    } catch (error) {
      console.error('Error getting active rides count:', error);
      return 0;
    }
  }

  async getAvailableDriversCount() {
    try {
      const result = await secureQuery(
        'SELECT COUNT(*) as count FROM drivers WHERE available = true',
        []
      );
      return parseInt(result.rows[0]?.count || 0);
    } catch (error) {
      console.error('Error getting available drivers count:', error);
      return 0;
    }
  }

  async getActiveRidersCount() {
    try {
      const result = await secureQuery(
        'SELECT COUNT(DISTINCT rider_id) as count FROM rides WHERE status IN ($1, $2, $3)',
        ['accepted', 'in_progress', 'pickup']
      );
      return parseInt(result.rows[0]?.count || 0);
    } catch (error) {
      console.error('Error getting active riders count:', error);
      return 0;
    }
  }

  async getTotalRevenue() {
    try {
      const result = await secureQuery(
        'SELECT COALESCE(SUM(fare), 0) as total FROM rides WHERE status = $1 AND created_at >= NOW() - INTERVAL \'24 hours\'',
        ['completed']
      );
      return parseFloat(result.rows[0]?.total || 0);
    } catch (error) {
      console.error('Error getting total revenue:', error);
      return 0;
    }
  }

  async getAverageWaitTime() {
    try {
      const result = await secureQuery(
        `SELECT AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))/60) as avg_wait 
         FROM rides 
         WHERE status = 'completed' 
         AND accepted_at IS NOT NULL 
         AND created_at >= NOW() - INTERVAL '1 hour'`,
        []
      );
      return parseFloat(result.rows[0]?.avg_wait || 0);
    } catch (error) {
      console.error('Error getting average wait time:', error);
      return 0;
    }
  }

  async getCompletionRate() {
    try {
      const result = await secureQuery(
        `SELECT 
           COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as completion_rate
         FROM rides 
         WHERE created_at >= NOW() - INTERVAL '24 hours'`,
        []
      );
      return parseFloat(result.rows[0]?.completion_rate || 0);
    } catch (error) {
      console.error('Error getting completion rate:', error);
      return 0;
    }
  }

  async getSafetyIncidentsCount() {
    try {
      const result = await secureQuery(
        'SELECT COUNT(*) as count FROM emergency_alerts WHERE created_at >= NOW() - INTERVAL \'24 hours\'',
        []
      );
      return parseInt(result.rows[0]?.count || 0);
    } catch (error) {
      console.error('Error getting safety incidents count:', error);
      return 0;
    }
  }

  calculateSystemHealth() {
    const { availableDrivers, activeRides, completionRate } = this.metrics;
    
    // Check for critical issues
    if (availableDrivers === 0 && activeRides > 0) {
      return 'critical';
    }
    
    if (completionRate < 70) {
      return 'degraded';
    }
    
    if (availableDrivers < 5) {
      return 'warning';
    }
    
    return 'healthy';
  }

  checkForAlerts(previousMetrics, currentMetrics) {
    const alerts = [];

    // Driver availability alert
    if (currentMetrics.availableDrivers < 5 && previousMetrics.availableDrivers >= 5) {
      alerts.push({
        type: 'warning',
        title: 'Low Driver Availability',
        message: `Only ${currentMetrics.availableDrivers} drivers available`,
        timestamp: new Date().toISOString()
      });
    }

    // Wait time alert
    if (currentMetrics.averageWaitTime > 10 && previousMetrics.averageWaitTime <= 10) {
      alerts.push({
        type: 'warning',
        title: 'High Wait Times',
        message: `Average wait time is ${currentMetrics.averageWaitTime.toFixed(1)} minutes`,
        timestamp: new Date().toISOString()
      });
    }

    // Safety incident alert
    if (currentMetrics.safetyIncidents > previousMetrics.safetyIncidents) {
      alerts.push({
        type: 'critical',
        title: 'Safety Incident',
        message: `${currentMetrics.safetyIncidents} safety incidents in the last 24 hours`,
        timestamp: new Date().toISOString()
      });
    }

    // System health change
    if (currentMetrics.systemHealth !== previousMetrics.systemHealth) {
      alerts.push({
        type: currentMetrics.systemHealth === 'healthy' ? 'info' : 'warning',
        title: 'System Health Change',
        message: `System health changed to ${currentMetrics.systemHealth}`,
        timestamp: new Date().toISOString()
      });
    }

    // Add new alerts
    this.alerts.push(...alerts);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Emit alerts to connected clients
    if (alerts.length > 0) {
      this.emit('alerts', alerts);
      this.broadcastAlerts(alerts);
    }
  }

  storeHistoricalData() {
    const timestamp = new Date().toISOString();
    
    // Store metrics history
    this.historicalData.rides.push({
      timestamp,
      activeRides: this.metrics.activeRides,
      availableDrivers: this.metrics.availableDrivers,
      activeRiders: this.metrics.activeRiders
    });

    this.historicalData.revenue.push({
      timestamp,
      totalRevenue: this.metrics.totalRevenue
    });

    this.historicalData.performance.push({
      timestamp,
      averageWaitTime: this.metrics.averageWaitTime,
      completionRate: this.metrics.completionRate,
      systemHealth: this.metrics.systemHealth
    });

    // Keep only last 1000 data points
    if (this.historicalData.rides.length > 1000) {
      this.historicalData.rides = this.historicalData.rides.slice(-1000);
    }
    if (this.historicalData.revenue.length > 1000) {
      this.historicalData.revenue = this.historicalData.revenue.slice(-1000);
    }
    if (this.historicalData.performance.length > 1000) {
      this.historicalData.performance = this.historicalData.performance.slice(-1000);
    }
  }

  broadcastMetrics() {
    if (this.socketService && this.socketService.getIO()) {
      this.socketService.getIO().to('admin').emit('analytics:metrics', {
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastAlerts(alerts) {
    if (this.socketService && this.socketService.getIO()) {
      this.socketService.getIO().to('admin').emit('analytics:alerts', alerts);
    }
  }

  startPeriodicUpdates() {
    // Send metrics to admin dashboard every 5 seconds
    setInterval(() => {
      this.broadcastMetrics();
    }, 5000);
  }

  // Public methods for external access
  getMetrics() {
    return this.metrics;
  }

  getHistoricalData() {
    return this.historicalData;
  }

  getAlerts() {
    return this.alerts;
  }

  // Generate analytics report
  async generateReport(startDate, endDate) {
    try {
      const report = {
        period: { startDate, endDate },
        summary: this.metrics,
        trends: await this.calculateTrends(startDate, endDate),
        recommendations: this.generateRecommendations(),
        generatedAt: new Date().toISOString()
      };

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async calculateTrends(startDate, endDate) {
    // Calculate trends based on historical data
    const trends = {
      ridesGrowth: 0,
      revenueGrowth: 0,
      waitTimeTrend: 0,
      completionRateTrend: 0
    };

    // Implementation for trend calculation
    // This would analyze historical data to determine growth rates

    return trends;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.availableDrivers < 10) {
      recommendations.push({
        type: 'driver_recruitment',
        priority: 'high',
        message: 'Consider driver recruitment campaigns to increase availability'
      });
    }

    if (this.metrics.averageWaitTime > 8) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: 'Optimize driver-rider matching to reduce wait times'
      });
    }

    if (this.metrics.completionRate < 85) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: 'Investigate ride cancellation reasons to improve completion rate'
      });
    }

    return recommendations;
  }

  // Cleanup
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

module.exports = RealTimeAnalytics; 