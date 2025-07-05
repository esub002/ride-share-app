/**
 * Advanced Location Tracking Service
 * Provides geofencing, route optimization, and real-time location analytics
 */

const { EventEmitter } = require('events');
const { logEvent } = require('../utils/log');
const { secureQuery } = require('../middleware/database');

class AdvancedLocationTracking extends EventEmitter {
  constructor(socketService) {
    super();
    this.socketService = socketService;
    this.activeGeofences = new Map(); // geofenceId -> geofence data
    this.trackingSessions = new Map(); // sessionId -> session data
    this.locationHistory = new Map(); // userId -> location history
    this.geofenceEvents = new Map(); // geofenceId -> events
    this.routeOptimizer = null;
    this.updateInterval = null;
    this.cleanupInterval = null;
    this.initialize();
  }

  initialize() {
    this.loadGeofences();
    this.startLocationTracking();
    this.startCleanup();
    this.setupEventListeners();
    console.log('✅ Advanced Location Tracking initialized');
  }

  setupEventListeners() {
    if (this.socketService) {
      this.socketService.on('location:update', (data) => {
        this.handleLocationUpdate(data);
      });
    }
  }

  async loadGeofences() {
    try {
      const result = await secureQuery(
        'SELECT * FROM geofences WHERE active = true',
        []
      );

      result.rows.forEach(row => {
        this.activeGeofences.set(row.id, {
          id: row.id,
          name: row.name,
          type: row.type,
          center: row.center,
          radius: row.radius,
          boundaries: row.boundaries,
          rules: row.rules,
          active: row.active,
          created_at: row.created_at
        });
      });

      console.log(`📍 Loaded ${this.activeGeofences.size} active geofences`);
    } catch (error) {
      console.error('Error loading geofences:', error);
      logEvent('location_error', { error: error.message, type: 'load_geofences' });
    }
  }

  startLocationTracking() {
    this.updateInterval = setInterval(() => {
      this.processLocationUpdates();
    }, 2000); // Process every 2 seconds
  }

  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Cleanup every 5 minutes
  }

  async handleLocationUpdate(data) {
    const { userId, latitude, longitude, timestamp, accuracy, speed, heading } = data;

    // Store location in history
    if (!this.locationHistory.has(userId)) {
      this.locationHistory.set(userId, []);
    }

    const locationData = {
      latitude,
      longitude,
      timestamp: timestamp || new Date().toISOString(),
      accuracy: accuracy || 0,
      speed: speed || 0,
      heading: heading || 0
    };

    this.locationHistory.get(userId).push(locationData);

    // Keep only last 1000 locations per user
    if (this.locationHistory.get(userId).length > 1000) {
      this.locationHistory.set(userId, this.locationHistory.get(userId).slice(-1000));
    }

    // Check geofence events
    await this.checkGeofenceEvents(userId, locationData);

    // Emit location update event
    this.emit('location:updated', { userId, location: locationData });

    // Store in database
    await this.storeLocationData(userId, locationData);
  }

  async checkGeofenceEvents(userId, locationData) {
    const { latitude, longitude } = locationData;

    for (const [geofenceId, geofence] of this.activeGeofences) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        geofence.center.lat,
        geofence.center.lng
      );

      const isInside = distance <= geofence.radius;
      const wasInside = this.wasUserInGeofence(userId, geofenceId);

      if (isInside && !wasInside) {
        // User entered geofence
        await this.handleGeofenceEntered(userId, geofence, locationData);
      } else if (!isInside && wasInside) {
        // User exited geofence
        await this.handleGeofenceExited(userId, geofence, locationData);
      }
    }
  }

  wasUserInGeofence(userId, geofenceId) {
    const events = this.geofenceEvents.get(geofenceId) || [];
    const userEvents = events.filter(event => event.userId === userId);
    
    if (userEvents.length === 0) return false;
    
    const lastEvent = userEvents[userEvents.length - 1];
    return lastEvent.type === 'entered';
  }

  async handleGeofenceEntered(userId, geofence, locationData) {
    const event = {
      id: this.generateEventId(),
      geofenceId: geofence.id,
      userId,
      type: 'entered',
      location: locationData,
      timestamp: new Date().toISOString(),
      metadata: {
        geofenceName: geofence.name,
        geofenceType: geofence.type
      }
    };

    // Store event
    if (!this.geofenceEvents.has(geofence.id)) {
      this.geofenceEvents.set(geofence.id, []);
    }
    this.geofenceEvents.get(geofence.id).push(event);

    // Emit event
    this.emit('geofence:entered', event);

    // Broadcast to relevant users
    if (this.socketService && this.socketService.getIO()) {
      this.socketService.getIO().to(`user:${userId}`).emit('geofence:entered', event);
      
      // Notify admins
      this.socketService.getIO().to('admin').emit('geofence:event', event);
    }

    // Store in database
    await this.storeGeofenceEvent(event);

    // Apply geofence rules
    await this.applyGeofenceRules(geofence, userId, 'entered');

    console.log(`📍 User ${userId} entered geofence: ${geofence.name}`);
  }

  async handleGeofenceExited(userId, geofence, locationData) {
    const event = {
      id: this.generateEventId(),
      geofenceId: geofence.id,
      userId,
      type: 'exited',
      location: locationData,
      timestamp: new Date().toISOString(),
      metadata: {
        geofenceName: geofence.name,
        geofenceType: geofence.type
      }
    };

    // Store event
    if (!this.geofenceEvents.has(geofence.id)) {
      this.geofenceEvents.set(geofence.id, []);
    }
    this.geofenceEvents.get(geofence.id).push(event);

    // Emit event
    this.emit('geofence:exited', event);

    // Broadcast to relevant users
    if (this.socketService && this.socketService.getIO()) {
      this.socketService.getIO().to(`user:${userId}`).emit('geofence:exited', event);
      
      // Notify admins
      this.socketService.getIO().to('admin').emit('geofence:event', event);
    }

    // Store in database
    await this.storeGeofenceEvent(event);

    // Apply geofence rules
    await this.applyGeofenceRules(geofence, userId, 'exited');

    console.log(`📍 User ${userId} exited geofence: ${geofence.name}`);
  }

  async applyGeofenceRules(geofence, userId, eventType) {
    if (!geofence.rules) return;

    const rules = geofence.rules[eventType] || [];
    
    for (const rule of rules) {
      try {
        switch (rule.action) {
          case 'notify':
            await this.sendNotification(userId, rule.message);
            break;
          case 'update_status':
            await this.updateUserStatus(userId, rule.status);
            break;
          case 'trigger_alert':
            await this.triggerAlert(userId, rule.alertType);
            break;
          case 'apply_pricing':
            await this.applyPricing(userId, rule.pricing);
            break;
          default:
            console.log(`Unknown geofence rule action: ${rule.action}`);
        }
      } catch (error) {
        console.error(`Error applying geofence rule:`, error);
        logEvent('geofence_rule_error', { 
          error: error.message, 
          geofenceId: geofence.id, 
          userId, 
          rule 
        });
      }
    }
  }

  async sendNotification(userId, message) {
    if (this.socketService && this.socketService.getIO()) {
      this.socketService.getIO().to(`user:${userId}`).emit('notification:geofence', {
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async updateUserStatus(userId, status) {
    try {
      await secureQuery(
        'UPDATE users SET status = $1 WHERE id = $2',
        [status, userId]
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  async triggerAlert(userId, alertType) {
    const alert = {
      id: this.generateEventId(),
      userId,
      type: alertType,
      timestamp: new Date().toISOString(),
      location: this.getUserCurrentLocation(userId)
    };

    this.emit('alert:triggered', alert);

    if (this.socketService && this.socketService.getIO()) {
      this.socketService.getIO().to('admin').emit('alert:triggered', alert);
    }
  }

  async applyPricing(userId, pricing) {
    // Apply dynamic pricing based on geofence
    console.log(`Applying pricing for user ${userId}:`, pricing);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance * 1000; // Convert to meters
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  async storeLocationData(userId, locationData) {
    try {
      await secureQuery(
        `INSERT INTO location_history (user_id, latitude, longitude, accuracy, speed, heading, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          locationData.latitude,
          locationData.longitude,
          locationData.accuracy,
          locationData.speed,
          locationData.heading,
          locationData.timestamp
        ]
      );
    } catch (error) {
      console.error('Error storing location data:', error);
      logEvent('location_error', { error: error.message, type: 'store_location' });
    }
  }

  async storeGeofenceEvent(event) {
    try {
      await secureQuery(
        `INSERT INTO geofence_events (event_id, geofence_id, user_id, event_type, location_data, metadata, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          event.id,
          event.geofenceId,
          event.userId,
          event.type,
          JSON.stringify(event.location),
          JSON.stringify(event.metadata),
          event.timestamp
        ]
      );
    } catch (error) {
      console.error('Error storing geofence event:', error);
      logEvent('geofence_error', { error: error.message, type: 'store_event' });
    }
  }

  processLocationUpdates() {
    // Process any pending location updates
    // This could include batch processing, analytics, etc.
  }

  cleanupOldData() {
    // Clean up old location history and events
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Clean up location history
    for (const [userId, history] of this.locationHistory) {
      this.locationHistory.set(userId, 
        history.filter(location => new Date(location.timestamp) > cutoffTime)
      );
    }

    // Clean up geofence events (keep last 1000 per geofence)
    for (const [geofenceId, events] of this.geofenceEvents) {
      if (events.length > 1000) {
        this.geofenceEvents.set(geofenceId, events.slice(-1000));
      }
    }
  }

  getUserCurrentLocation(userId) {
    const history = this.locationHistory.get(userId);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  getUserLocationHistory(userId, limit = 100) {
    const history = this.locationHistory.get(userId) || [];
    return history.slice(-limit);
  }

  getGeofenceEvents(geofenceId, limit = 100) {
    const events = this.geofenceEvents.get(geofenceId) || [];
    return events.slice(-limit);
  }

  async createGeofence(geofenceData) {
    try {
      const result = await secureQuery(
        `INSERT INTO geofences (name, type, center, radius, boundaries, rules, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          geofenceData.name,
          geofenceData.type,
          JSON.stringify(geofenceData.center),
          geofenceData.radius,
          JSON.stringify(geofenceData.boundaries),
          JSON.stringify(geofenceData.rules),
          geofenceData.active || true
        ]
      );

      const geofence = result.rows[0];
      this.activeGeofences.set(geofence.id, geofence);
      
      this.emit('geofence:created', geofence);
      return geofence;
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  }

  async updateGeofence(geofenceId, updates) {
    try {
      const result = await secureQuery(
        `UPDATE geofences 
         SET name = $1, type = $2, center = $3, radius = $4, boundaries = $5, rules = $6, active = $7
         WHERE id = $8
         RETURNING *`,
        [
          updates.name,
          updates.type,
          JSON.stringify(updates.center),
          updates.radius,
          JSON.stringify(updates.boundaries),
          JSON.stringify(updates.rules),
          updates.active,
          geofenceId
        ]
      );

      if (result.rows.length > 0) {
        const geofence = result.rows[0];
        this.activeGeofences.set(geofence.id, geofence);
        
        this.emit('geofence:updated', geofence);
        return geofence;
      }
      
      throw new Error('Geofence not found');
    } catch (error) {
      console.error('Error updating geofence:', error);
      throw error;
    }
  }

  async deleteGeofence(geofenceId) {
    try {
      await secureQuery('DELETE FROM geofences WHERE id = $1', [geofenceId]);
      this.activeGeofences.delete(geofenceId);
      
      this.emit('geofence:deleted', { geofenceId });
    } catch (error) {
      console.error('Error deleting geofence:', error);
      throw error;
    }
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveGeofences() {
    return Array.from(this.activeGeofences.values());
  }

  getTrackingStats() {
    return {
      activeGeofences: this.activeGeofences.size,
      trackingSessions: this.trackingSessions.size,
      totalUsers: this.locationHistory.size,
      totalEvents: Array.from(this.geofenceEvents.values())
        .reduce((sum, events) => sum + events.length, 0)
    };
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    console.log('✅ Advanced Location Tracking destroyed');
  }
}

module.exports = AdvancedLocationTracking; 