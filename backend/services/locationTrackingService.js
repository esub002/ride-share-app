/**
 * Advanced Location Tracking Service
 * Provides real-time location tracking, geofencing, and route optimization
 */

const { EventEmitter } = require('events');
const { logEvent } = require('../utils/log');
const { secureQuery } = require('../middleware/database');

class LocationTrackingService extends EventEmitter {
  constructor(socketService) {
    super();
    this.socketService = socketService;
    this.activeTrackers = new Map(); // userId -> tracker info
    this.geofences = new Map(); // geofenceId -> geofence config
    this.locationHistory = new Map(); // userId -> location history
    this.routeOptimizer = null;
    this.updateInterval = null;
    this.initialize();
  }

  async initialize() {
    console.log('📍 Initializing Location Tracking Service...');
    
    // Load geofences from database
    await this.loadGeofences();
    
    // Start location processing
    this.startLocationProcessing();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('✅ Location Tracking Service initialized');
  }

  setupEventListeners() {
    // Listen for location updates from socket service
    this.socketService.on('location:update', (data) => {
      this.processLocationUpdate(data);
    });

    // Listen for driver availability changes
    this.socketService.on('driver:available', (data) => {
      this.startTracking(data.userId, data.location);
    });

    this.socketService.on('driver:unavailable', (data) => {
      this.stopTracking(data.userId);
    });
  }

  async loadGeofences() {
    try {
      const result = await secureQuery(
        'SELECT * FROM geofences WHERE active = true',
        []
      );

      result.rows.forEach(row => {
        this.geofences.set(row.id, {
          id: row.id,
          name: row.name,
          type: row.type, // pickup_zone, dropoff_zone, restricted_area, etc.
          center: {
            latitude: parseFloat(row.center_lat),
            longitude: parseFloat(row.center_lng)
          },
          radius: parseFloat(row.radius),
          properties: row.properties || {}
        });
      });

      console.log(`📍 Loaded ${this.geofences.size} geofences`);
    } catch (error) {
      console.error('Error loading geofences:', error);
    }
  }

  startLocationProcessing() {
    // Process location updates every 5 seconds
    this.updateInterval = setInterval(() => {
      this.processBatchLocationUpdates();
    }, 5000);
  }

  async processLocationUpdate(data) {
    const { userId, latitude, longitude, timestamp, accuracy, speed, heading } = data;

    try {
      // Store location in history
      this.storeLocationHistory(userId, {
        latitude,
        longitude,
        timestamp: timestamp || new Date().toISOString(),
        accuracy,
        speed,
        heading
      });

      // Check geofence triggers
      const geofenceEvents = this.checkGeofenceTriggers(userId, { latitude, longitude });

      // Update active tracker
      if (this.activeTrackers.has(userId)) {
        const tracker = this.activeTrackers.get(userId);
        tracker.lastLocation = { latitude, longitude, timestamp };
        tracker.lastUpdate = new Date().toISOString();
        
        // Calculate distance traveled
        if (tracker.previousLocation) {
          tracker.distanceTraveled += this.calculateDistance(
            tracker.previousLocation,
            { latitude, longitude }
          );
        }
        
        tracker.previousLocation = { latitude, longitude };
      }

      // Emit location update event
      this.emit('location:updated', {
        userId,
        location: { latitude, longitude, timestamp },
        geofenceEvents
      });

      // Broadcast to relevant clients
      this.broadcastLocationUpdate(userId, { latitude, longitude, timestamp });

    } catch (error) {
      console.error('Error processing location update:', error);
    }
  }

  storeLocationHistory(userId, location) {
    if (!this.locationHistory.has(userId)) {
      this.locationHistory.set(userId, []);
    }

    const history = this.locationHistory.get(userId);
    history.push(location);

    // Keep only last 1000 locations per user
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  checkGeofenceTriggers(userId, location) {
    const events = [];

    for (const [geofenceId, geofence] of this.geofences) {
      const distance = this.calculateDistance(geofence.center, location);
      
      if (distance <= geofence.radius) {
        // User entered geofence
        events.push({
          type: 'geofence_entered',
          geofenceId,
          geofenceName: geofence.name,
          geofenceType: geofence.type,
          distance,
          timestamp: new Date().toISOString()
        });

        // Handle specific geofence types
        this.handleGeofenceEvent(userId, geofence, 'entered');
      }
    }

    return events;
  }

  handleGeofenceEvent(userId, geofence, eventType) {
    switch (geofence.type) {
      case 'pickup_zone':
        this.handlePickupZoneEvent(userId, geofence, eventType);
        break;
      case 'dropoff_zone':
        this.handleDropoffZoneEvent(userId, geofence, eventType);
        break;
      case 'restricted_area':
        this.handleRestrictedAreaEvent(userId, geofence, eventType);
        break;
      case 'speed_limit_zone':
        this.handleSpeedLimitZoneEvent(userId, geofence, eventType);
        break;
    }
  }

  handlePickupZoneEvent(userId, geofence, eventType) {
    if (eventType === 'entered') {
      // Notify rider that driver is approaching pickup location
      this.socketService.sendToUser(userId, 'pickup:approaching', {
        geofenceName: geofence.name,
        estimatedArrival: this.calculateETA(userId, geofence.center)
      });
    }
  }

  handleDropoffZoneEvent(userId, geofence, eventType) {
    if (eventType === 'entered') {
      // Notify rider that they're approaching destination
      this.socketService.sendToUser(userId, 'dropoff:approaching', {
        geofenceName: geofence.name
      });
    }
  }

  handleRestrictedAreaEvent(userId, geofence, eventType) {
    if (eventType === 'entered') {
      // Send warning to driver about restricted area
      this.socketService.sendToUser(userId, 'location:restricted_area', {
        geofenceName: geofence.name,
        message: geofence.properties.message || 'You have entered a restricted area'
      });
    }
  }

  handleSpeedLimitZoneEvent(userId, geofence, eventType) {
    if (eventType === 'entered') {
      // Notify driver about speed limit
      this.socketService.sendToUser(userId, 'location:speed_limit', {
        geofenceName: geofence.name,
        speedLimit: geofence.properties.speedLimit,
        message: `Speed limit: ${geofence.properties.speedLimit} km/h`
      });
    }
  }

  startTracking(userId, initialLocation) {
    const tracker = {
      userId,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      lastLocation: initialLocation,
      previousLocation: null,
      distanceTraveled: 0,
      geofencesEntered: new Set(),
      route: null
    };

    this.activeTrackers.set(userId, tracker);

    // Emit tracking started event
    this.emit('tracking:started', { userId, tracker });

    console.log(`📍 Started tracking user: ${userId}`);
  }

  stopTracking(userId) {
    const tracker = this.activeTrackers.get(userId);
    if (tracker) {
      // Calculate final statistics
      const finalStats = {
        userId,
        startTime: tracker.startTime,
        endTime: new Date().toISOString(),
        totalDistance: tracker.distanceTraveled,
        duration: new Date(tracker.endTime) - new Date(tracker.startTime),
        geofencesEntered: Array.from(tracker.geofencesEntered)
      };

      // Store tracking session
      this.storeTrackingSession(finalStats);

      // Remove from active trackers
      this.activeTrackers.delete(userId);

      // Emit tracking stopped event
      this.emit('tracking:stopped', finalStats);

      console.log(`📍 Stopped tracking user: ${userId}`);
    }
  }

  async storeTrackingSession(stats) {
    try {
      await secureQuery(
        `INSERT INTO tracking_sessions 
         (user_id, start_time, end_time, total_distance, duration, geofences_entered)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          stats.userId,
          stats.startTime,
          stats.endTime,
          stats.totalDistance,
          stats.duration,
          JSON.stringify(stats.geofencesEntered)
        ]
      );
    } catch (error) {
      console.error('Error storing tracking session:', error);
    }
  }

  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLng = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  calculateETA(userId, destination) {
    const tracker = this.activeTrackers.get(userId);
    if (!tracker || !tracker.lastLocation) {
      return null;
    }

    const distance = this.calculateDistance(tracker.lastLocation, destination);
    const averageSpeed = 30; // km/h - could be calculated from historical data
    const etaMinutes = (distance / averageSpeed) * 60;

    return Math.round(etaMinutes);
  }

  broadcastLocationUpdate(userId, location) {
    if (this.socketService && this.socketService.getIO()) {
      // Broadcast to ride participants
      this.socketService.getIO().to(`user:${userId}`).emit('location:update', {
        userId,
        location,
        timestamp: new Date().toISOString()
      });
    }
  }

  processBatchLocationUpdates() {
    // Process any pending location updates in batch
    // This could include route optimization, traffic analysis, etc.
  }

  // Route optimization methods
  async optimizeRoute(origin, destination, waypoints = []) {
    try {
      // This would integrate with Google Maps API or similar service
      const optimizedRoute = {
        origin,
        destination,
        waypoints,
        distance: this.calculateDistance(origin, destination),
        duration: this.calculateDistance(origin, destination) * 2, // Rough estimate
        trafficLevel: 'moderate',
        alternatives: []
      };

      return optimizedRoute;
    } catch (error) {
      console.error('Error optimizing route:', error);
      return null;
    }
  }

  // Geofence management
  async createGeofence(geofenceData) {
    try {
      const result = await secureQuery(
        `INSERT INTO geofences 
         (name, type, center_lat, center_lng, radius, properties, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          geofenceData.name,
          geofenceData.type,
          geofenceData.center.latitude,
          geofenceData.center.longitude,
          geofenceData.radius,
          JSON.stringify(geofenceData.properties || {}),
          true
        ]
      );

      const newGeofence = result.rows[0];
      this.geofences.set(newGeofence.id, {
        id: newGeofence.id,
        name: newGeofence.name,
        type: newGeofence.type,
        center: {
          latitude: parseFloat(newGeofence.center_lat),
          longitude: parseFloat(newGeofence.center_lng)
        },
        radius: parseFloat(newGeofence.radius),
        properties: newGeofence.properties || {}
      });

      return newGeofence;
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  }

  // Public methods
  getActiveTrackers() {
    return Array.from(this.activeTrackers.values());
  }

  getLocationHistory(userId) {
    return this.locationHistory.get(userId) || [];
  }

  getGeofences() {
    return Array.from(this.geofences.values());
  }

  // Cleanup
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

module.exports = LocationTrackingService; 