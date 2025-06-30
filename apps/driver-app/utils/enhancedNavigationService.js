import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

class EnhancedNavigationService {
  constructor() {
    this.currentRoute = null;
    this.navigationMode = 'pickup'; // 'pickup' or 'dropoff'
    this.isNavigating = false;
    this.routeUpdateInterval = null;
    this.locationSubscription = null;
  }

  // Initialize the navigation service
  async init() {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Request background location permissions for navigation
      if (Platform.OS === 'ios') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('Background location permission not granted');
        }
      }

      console.log('🧭 Enhanced navigation service initialized');
    } catch (error) {
      console.error('🧭 Failed to initialize navigation service:', error);
      throw error;
    }
  }

  // Start navigation to a destination
  async startNavigation(destination, mode = 'pickup') {
    try {
      this.navigationMode = mode;
      this.isNavigating = true;

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Calculate route
      const route = await this.calculateRoute(currentLocation.coords, destination);
      this.currentRoute = route;

      // Start location tracking for navigation
      await this.startLocationTracking();

      // Start route updates
      this.startRouteUpdates();

      console.log(`🧭 Navigation started to ${mode} location`);
      return route;
    } catch (error) {
      console.error('🧭 Failed to start navigation:', error);
      throw error;
    }
  }

  // Stop navigation
  stopNavigation() {
    this.isNavigating = false;
    this.currentRoute = null;
    
    if (this.routeUpdateInterval) {
      clearInterval(this.routeUpdateInterval);
      this.routeUpdateInterval = null;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    console.log('🧭 Navigation stopped');
  }

  // Calculate route using Google Directions API
  async calculateRoute(origin, destination, waypoints = []) {
    try {
      // In a real app, you would use Google Directions API
      // For now, we'll create a mock route with traffic data
      const route = {
        origin,
        destination,
        waypoints,
        distance: this.calculateDistance(origin, destination),
        duration: this.calculateDuration(origin, destination),
        durationInTraffic: this.calculateDurationWithTraffic(origin, destination),
        steps: this.generateRouteSteps(origin, destination),
        polyline: this.generatePolyline(origin, destination),
        trafficLevel: this.getTrafficLevel(),
        tolls: this.checkTolls(origin, destination),
        fuelEfficient: this.isFuelEfficient(origin, destination),
      };

      return route;
    } catch (error) {
      console.error('🧭 Failed to calculate route:', error);
      throw error;
    }
  }

  // Calculate distance between two points
  calculateDistance(origin, destination) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (origin.latitude * Math.PI) / 180;
    const φ2 = (destination.latitude * Math.PI) / 180;
    const Δφ = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const Δλ = ((destination.longitude - origin.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Calculate estimated duration
  calculateDuration(origin, destination) {
    const distance = this.calculateDistance(origin, destination);
    const averageSpeed = 30; // km/h
    return Math.ceil((distance / 1000) / averageSpeed * 60); // minutes
  }

  // Calculate duration with traffic
  calculateDurationWithTraffic(origin, destination) {
    const baseDuration = this.calculateDuration(origin, destination);
    const trafficMultiplier = this.getTrafficMultiplier();
    return Math.ceil(baseDuration * trafficMultiplier);
  }

  // Get traffic level (mock data)
  getTrafficLevel() {
    const levels = ['low', 'medium', 'high', 'severe'];
    const weights = [0.4, 0.3, 0.2, 0.1]; // Probability weights
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return levels[i];
      }
    }
    
    return 'medium';
  }

  // Get traffic multiplier based on traffic level
  getTrafficMultiplier() {
    const trafficLevel = this.getTrafficLevel();
    const multipliers = {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      severe: 2.0,
    };
    return multipliers[trafficLevel] || 1.0;
  }

  // Check if route has tolls
  checkTolls(origin, destination) {
    // Mock toll detection - in real app, use Google Directions API
    const distance = this.calculateDistance(origin, destination);
    return distance > 10000; // Assume tolls for routes > 10km
  }

  // Check if route is fuel efficient
  isFuelEfficient(origin, destination) {
    // Mock fuel efficiency calculation
    const distance = this.calculateDistance(origin, destination);
    const hasHighways = distance > 5000;
    return hasHighways; // Highways are generally more fuel efficient
  }

  // Generate route steps (mock data)
  generateRouteSteps(origin, destination) {
    const steps = [];
    const numSteps = Math.floor(this.calculateDistance(origin, destination) / 1000) + 1;
    
    for (let i = 0; i < numSteps; i++) {
      steps.push({
        id: i,
        instruction: this.getRandomInstruction(),
        distance: Math.floor(this.calculateDistance(origin, destination) / numSteps),
        duration: Math.floor(this.calculateDuration(origin, destination) / numSteps),
        maneuver: this.getRandomManeuver(),
      });
    }
    
    return steps;
  }

  // Get random navigation instruction
  getRandomInstruction() {
    const instructions = [
      'Continue straight',
      'Turn right',
      'Turn left',
      'Take the exit',
      'Merge onto highway',
      'Keep left',
      'Keep right',
    ];
    return instructions[Math.floor(Math.random() * instructions.length)];
  }

  // Get random maneuver type
  getRandomManeuver() {
    const maneuvers = ['straight', 'turn-right', 'turn-left', 'merge', 'exit'];
    return maneuvers[Math.floor(Math.random() * maneuvers.length)];
  }

  // Generate polyline coordinates
  generatePolyline(origin, destination) {
    const coordinates = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const lat = origin.latitude + (destination.latitude - origin.latitude) * (i / steps);
      const lng = origin.longitude + (destination.longitude - origin.longitude) * (i / steps);
      coordinates.push({ latitude: lat, longitude: lng });
    }
    
    return coordinates;
  }

  // Start location tracking for navigation
  async startLocationTracking() {
    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );
    } catch (error) {
      console.error('🧭 Failed to start location tracking:', error);
    }
  }

  // Handle location updates during navigation
  handleLocationUpdate(location) {
    if (!this.isNavigating || !this.currentRoute) return;

    const currentCoords = location.coords;
    const destination = this.currentRoute.destination;
    
    // Check if arrived at destination
    const distanceToDestination = this.calculateDistance(currentCoords, destination);
    
    if (distanceToDestination < 50) { // Within 50 meters
      this.handleArrival();
    }

    // Update route progress
    this.updateRouteProgress(currentCoords);
  }

  // Handle arrival at destination
  handleArrival() {
    this.stopNavigation();
    
    const message = this.navigationMode === 'pickup' 
      ? 'You have arrived at the pickup location!'
      : 'You have arrived at the destination!';
    
    Alert.alert('Arrived!', message, [{ text: 'OK' }]);
  }

  // Update route progress
  updateRouteProgress(currentLocation) {
    // Update current route with new location
    if (this.currentRoute) {
      this.currentRoute.currentLocation = currentLocation;
      this.currentRoute.distanceRemaining = this.calculateDistance(
        currentLocation,
        this.currentRoute.destination
      );
    }
  }

  // Start periodic route updates
  startRouteUpdates() {
    this.routeUpdateInterval = setInterval(async () => {
      if (this.isNavigating && this.currentRoute) {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          // Recalculate route with current location
          const updatedRoute = await this.calculateRoute(
            currentLocation.coords,
            this.currentRoute.destination,
            this.currentRoute.waypoints
          );
          
          this.currentRoute = { ...this.currentRoute, ...updatedRoute };
        } catch (error) {
          console.error('🧭 Failed to update route:', error);
        }
      }
    }, 30000); // Update every 30 seconds
  }

  // Open external navigation app
  async openExternalNavigation(destination, mode = 'driving') {
    try {
      const { latitude, longitude } = destination;
      const label = encodeURIComponent(destination.label || 'Destination');
      
      let url;
      
      if (Platform.OS === 'ios') {
        // Apple Maps
        url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      } else {
        // Google Maps
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${mode}`;
      }

      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
        console.log('🧭 Opened external navigation app');
      } else {
        throw new Error('No navigation app available');
      }
    } catch (error) {
      console.error('🧭 Failed to open external navigation:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to open navigation app. Please install Google Maps or Apple Maps.',
        [{ text: 'OK' }]
      );
    }
  }

  // Get alternative routes
  async getAlternativeRoutes(origin, destination) {
    try {
      const routes = [];
      
      // Generate 3 alternative routes with different characteristics
      for (let i = 0; i < 3; i++) {
        const route = await this.calculateRoute(origin, destination);
        route.name = this.getRouteName(i);
        route.description = this.getRouteDescription(i);
        routes.push(route);
      }
      
      return routes;
    } catch (error) {
      console.error('🧭 Failed to get alternative routes:', error);
      return [];
    }
  }

  // Get route name
  getRouteName(index) {
    const names = ['Fastest Route', 'Eco-Friendly', 'Avoid Tolls'];
    return names[index] || `Route ${index + 1}`;
  }

  // Get route description
  getRouteDescription(index) {
    const descriptions = [
      'Quickest way to destination',
      'Most fuel-efficient route',
      'Avoids toll roads',
    ];
    return descriptions[index] || 'Alternative route';
  }

  // Format distance for display
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  // Format duration for display
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  // Get current navigation status
  getStatus() {
    return {
      isNavigating: this.isNavigating,
      mode: this.navigationMode,
      currentRoute: this.currentRoute,
    };
  }

  // Cleanup resources
  cleanup() {
    this.stopNavigation();
    console.log('🧭 Navigation service cleaned up');
  }
}

// Create singleton instance
const enhancedNavigationService = new EnhancedNavigationService();

export default enhancedNavigationService; 