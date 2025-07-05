/**
 * Real-Time Performance Dashboard Service
 * Provides live system health monitoring, business intelligence, and performance analytics
 */

const { EventEmitter } = require('events');
const os = require('os');
const { logEvent } = require('../utils/log');
const { secureQuery } = require('../middleware/database');

class RealTimePerformanceDashboard extends EventEmitter {
  constructor(socketService) {
    super();
    this.socketService = socketService;
    this.metrics = {
      system: {
        cpu: 0,
        memory: 0,
        network: {
          bytesIn: 0,
          bytesOut: 0,
          connections: 0
        },
        disk: {
          usage: 0,
          iops: 0
        }
      },
      application: {
        responseTime: 0,
        errorRate: 0,
        throughput: 0,
        activeConnections: 0,
        queueSize: 0
      },
      business: {
        activeRides: 0,
        availableDrivers: 0,
        totalRevenue: 0,
        averageWaitTime: 0,
        completionRate: 0,
        customerSatisfaction: 0
      },
      realtime: {
        socketConnections: 0,
        messageThroughput: 0,
        eventLatency: 0,
        reconnectionRate: 0
      }
    };
    this.historicalData = {
      system: [],
      application: [],
      business: [],
      realtime: []
    };
    this.alerts = [];
    this.thresholds = {
      cpu: 80,
      memory: 85,
      errorRate: 5,
      responseTime: 1000,
      reconnectionRate: 10
    };
    this.updateInterval = null;
    this.alertInterval = null;
    this.initialize();
  }

  initialize() {
    this.startMetricsCollection();
    this.startAlerting();
    this.setupEventListeners();
    console.log('✅ Real-Time Performance Dashboard initialized');
  }

  startMetricsCollection() {
    this.updateInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.collectBusinessMetrics();
      this.collectRealtimeMetrics();
      this.storeHistoricalData();
      this.broadcastMetrics();
    }, 5000); // Update every 5 seconds
  }

  startAlerting() {
    this.alertInterval = setInterval(() => {
      this.checkAlerts();
    }, 10000); // Check alerts every 10 seconds
  }

  setupEventListeners() {
    // Listen to socket service events
    if (this.socketService) {
      this.socketService.on('connection', () => this.updateConnectionMetrics());
      this.socketService.on('disconnection', () => this.updateConnectionMetrics());
      this.socketService.on('error', (error) => this.handleError(error));
    }
  }

  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalCPU = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total);
    }, 0) / cpus.length * 100;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    // Network stats (simplified - in production, use more sophisticated monitoring)
    const networkInterfaces = os.networkInterfaces();
    let bytesIn = 0;
    let bytesOut = 0;
    
    Object.values(networkInterfaces).forEach(interfaces => {
      interfaces.forEach(interface => {
        if (interface.family === 'IPv4' && !interface.internal) {
          // In production, use actual network monitoring tools
          bytesIn += Math.random() * 1000;
          bytesOut += Math.random() * 1000;
        }
      });
    });

    this.metrics.system = {
      cpu: Math.round(totalCPU * 100) / 100,
      memory: Math.round(memoryUsage * 100) / 100,
      network: {
        bytesIn: Math.round(bytesIn),
        bytesOut: Math.round(bytesOut),
        connections: this.socketService ? this.socketService.getConnectionStats().activeConnections : 0
      },
      disk: {
        usage: Math.random() * 100, // In production, use actual disk monitoring
        iops: Math.random() * 1000
      }
    };
  }

  collectApplicationMetrics() {
    // In production, integrate with APM tools like New Relic, DataDog, etc.
    const responseTime = Math.random() * 500 + 50; // Simulated response time
    const errorRate = Math.random() * 2; // Simulated error rate
    const throughput = Math.random() * 1000 + 100; // Simulated throughput

    this.metrics.application = {
      responseTime: Math.round(responseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput),
      activeConnections: this.socketService ? this.socketService.getConnectionStats().activeConnections : 0,
      queueSize: Math.random() * 100
    };
  }

  async collectBusinessMetrics() {
    try {
      // Get active rides
      const activeRidesResult = await secureQuery(
        'SELECT COUNT(*) as count FROM rides WHERE status IN ($1, $2, $3)',
        ['accepted', 'in_progress', 'picked_up']
      );
      const activeRides = parseInt(activeRidesResult.rows[0]?.count || 0);

      // Get available drivers
      const availableDriversResult = await secureQuery(
        'SELECT COUNT(*) as count FROM drivers WHERE available = true',
        []
      );
      const availableDrivers = parseInt(availableDriversResult.rows[0]?.count || 0);

      // Get total revenue (last 24 hours)
      const revenueResult = await secureQuery(
        'SELECT COALESCE(SUM(fare), 0) as total FROM rides WHERE status = $1 AND created_at >= NOW() - INTERVAL \'24 hours\'',
        ['completed']
      );
      const totalRevenue = parseFloat(revenueResult.rows[0]?.total || 0);

      // Get average wait time (last hour)
      const waitTimeResult = await secureQuery(
        `SELECT AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))) as avg_wait 
         FROM rides 
         WHERE status = 'completed' 
         AND accepted_at IS NOT NULL 
         AND created_at >= NOW() - INTERVAL '1 hour'`,
        []
      );
      const averageWaitTime = Math.round(parseFloat(waitTimeResult.rows[0]?.avg_wait || 0) / 60); // Convert to minutes

      // Get completion rate (last 24 hours)
      const completionResult = await secureQuery(
        `SELECT 
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           COUNT(*) as total
         FROM rides 
         WHERE created_at >= NOW() - INTERVAL '24 hours'`,
        []
      );
      const completed = parseInt(completionResult.rows[0]?.completed || 0);
      const total = parseInt(completionResult.rows[0]?.total || 1);
      const completionRate = Math.round((completed / total) * 100);

      this.metrics.business = {
        activeRides,
        availableDrivers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageWaitTime,
        completionRate,
        customerSatisfaction: Math.random() * 2 + 3.5 // Simulated rating
      };
    } catch (error) {
      console.error('Error collecting business metrics:', error);
      logEvent('dashboard_error', { error: error.message, type: 'business_metrics' });
    }
  }

  collectRealtimeMetrics() {
    if (!this.socketService) return;

    const stats = this.socketService.getConnectionStats();
    const messageThroughput = Math.random() * 1000 + 100; // Simulated message throughput
    const eventLatency = Math.random() * 50 + 10; // Simulated event latency

    this.metrics.realtime = {
      socketConnections: stats.activeConnections,
      messageThroughput: Math.round(messageThroughput),
      eventLatency: Math.round(eventLatency),
      reconnectionRate: Math.random() * 5 // Simulated reconnection rate
    };
  }

  updateConnectionMetrics() {
    // This will be called when connections change
    this.collectRealtimeMetrics();
  }

  handleError(error) {
    logEvent('dashboard_error', { error: error.message, type: 'system_error' });
    this.emit('error', error);
  }

  checkAlerts() {
    const newAlerts = [];

    // System alerts
    if (this.metrics.system.cpu > this.thresholds.cpu) {
      newAlerts.push({
        type: 'system',
        severity: 'warning',
        message: `High CPU usage: ${this.metrics.system.cpu}%`,
        metric: 'cpu',
        value: this.metrics.system.cpu,
        threshold: this.thresholds.cpu,
        timestamp: new Date().toISOString()
      });
    }

    if (this.metrics.system.memory > this.thresholds.memory) {
      newAlerts.push({
        type: 'system',
        severity: 'critical',
        message: `High memory usage: ${this.metrics.system.memory}%`,
        metric: 'memory',
        value: this.metrics.system.memory,
        threshold: this.thresholds.memory,
        timestamp: new Date().toISOString()
      });
    }

    // Application alerts
    if (this.metrics.application.errorRate > this.thresholds.errorRate) {
      newAlerts.push({
        type: 'application',
        severity: 'critical',
        message: `High error rate: ${this.metrics.application.errorRate}%`,
        metric: 'errorRate',
        value: this.metrics.application.errorRate,
        threshold: this.thresholds.errorRate,
        timestamp: new Date().toISOString()
      });
    }

    if (this.metrics.application.responseTime > this.thresholds.responseTime) {
      newAlerts.push({
        type: 'application',
        severity: 'warning',
        message: `Slow response time: ${this.metrics.application.responseTime}ms`,
        metric: 'responseTime',
        value: this.metrics.application.responseTime,
        threshold: this.thresholds.responseTime,
        timestamp: new Date().toISOString()
      });
    }

    // Business alerts
    if (this.metrics.business.availableDrivers < 5) {
      newAlerts.push({
        type: 'business',
        severity: 'warning',
        message: `Low driver availability: ${this.metrics.business.availableDrivers} drivers`,
        metric: 'availableDrivers',
        value: this.metrics.business.availableDrivers,
        threshold: 5,
        timestamp: new Date().toISOString()
      });
    }

    if (this.metrics.business.completionRate < 80) {
      newAlerts.push({
        type: 'business',
        severity: 'warning',
        message: `Low completion rate: ${this.metrics.business.completionRate}%`,
        metric: 'completionRate',
        value: this.metrics.business.completionRate,
        threshold: 80,
        timestamp: new Date().toISOString()
      });
    }

    // Add new alerts
    this.alerts.push(...newAlerts);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Broadcast new alerts
    if (newAlerts.length > 0) {
      this.broadcastAlerts(newAlerts);
      this.emit('alerts', newAlerts);
    }
  }

  storeHistoricalData() {
    const timestamp = new Date().toISOString();
    
    this.historicalData.system.push({
      timestamp,
      ...this.metrics.system
    });

    this.historicalData.application.push({
      timestamp,
      ...this.metrics.application
    });

    this.historicalData.business.push({
      timestamp,
      ...this.metrics.business
    });

    this.historicalData.realtime.push({
      timestamp,
      ...this.metrics.realtime
    });

    // Keep only last 1000 data points for each category
    const maxDataPoints = 1000;
    Object.keys(this.historicalData).forEach(key => {
      if (this.historicalData[key].length > maxDataPoints) {
        this.historicalData[key] = this.historicalData[key].slice(-maxDataPoints);
      }
    });
  }

  broadcastMetrics() {
    if (this.socketService && this.socketService.getIO()) {
      this.socketService.getIO().to('admin').emit('dashboard:metrics', {
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastAlerts(alerts) {
    if (this.socketService && this.socketService.getIO()) {
      this.socketService.getIO().to('admin').emit('dashboard:alerts', alerts);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getHistoricalData(category, limit = 100) {
    const data = this.historicalData[category] || [];
    return data.slice(-limit);
  }

  getAlerts(limit = 50) {
    return this.alerts.slice(-limit);
  }

  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }
    console.log('✅ Real-Time Performance Dashboard destroyed');
  }
}

module.exports = RealTimePerformanceDashboard; 