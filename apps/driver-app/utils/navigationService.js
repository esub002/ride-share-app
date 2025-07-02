import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

class NavigationService {
  constructor() {
    this.currentRoute = null;
    this.navigationMode = 'pickup';
    this.isNavigating = false;
    this.routeUpdateInterval = null;
    this.locationSubscription = null;
  }

  async init() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      if (Platform.OS === 'ios') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('Background location permission not granted');
        }
      }

      console.log('🧭 Navigation service initialized');
    } catch (error) {
      console.error('🧭 Failed to initialize navigation service:', error);
      throw error;
    }
  }

  async startNavigation(destination, mode = 'pickup') {
    try {
      this.navigationMode = mode;
      this.isNavigating = true;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const route = await this.calculateRoute(currentLocation.coords, destination);
      this.currentRoute = route;

      await this.startLocationTracking();
      this.startRouteUpdates();

      console.log(`🧭 Navigation started to ${mode} location`);
      return route;
    } catch (error) {
      console.error('🧭 Failed to start navigation:', error);
      throw error;
    }
  }

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

  async calculateRoute(origin, destination, waypoints = []) {
    try {
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

  calculateDistance(origin, destination) {
    const R = 6371e3;
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

  calculateDuration(origin, destination) {
    const distance = this.calculateDistance(origin, destination);
    const averageSpeed = 30;
    return Math.ceil((distance / 1000) / averageSpeed * 60);
  }

  calculateDurationWithTraffic(origin, destination) {
    const baseDuration = this.calculateDuration(origin, destination);
    const trafficMultiplier = this.getTrafficMultiplier();
    return Math.ceil(baseDuration * trafficMultiplier);
  }

  getTrafficLevel() {
    const levels = ['low', 'medium', 'high', 'severe'];
    const weights = [0.4, 0.3, 0.2, 0.1];
    
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

  checkTolls(origin, destination) {
    const distance = this.calculateDistance(origin, destination);
    return distance > 10000;
  }

  isFuelEfficient(origin, destination) {
    const distance = this.calculateDistance(origin, destination);
    const hasHighways = distance > 5000;
    return hasHighways;
  }

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

  getRandomManeuver() {
    const maneuvers = ['straight', 'turn-right', 'turn-left', 'merge', 'exit'];
    return maneuvers[Math.floor(Math.random() * maneuvers.length)];
  }

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

  async startLocationTracking() {
    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );
    } catch (error) {
      console.error('🧭 Failed to start location tracking:', error);
    }
  }

  handleLocationUpdate(location) {
    if (!this.isNavigating || !this.currentRoute) return;

    const currentCoords = location.coords;
    const destination = this.currentRoute.destination;
    
    const distanceToDestination = this.calculateDistance(currentCoords, destination);
    
    if (distanceToDestination < 50) {
      this.handleArrival();
    }

    this.updateRouteProgress(currentCoords);
  }

  handleArrival() {
    this.stopNavigation();
    
    const message = this.navigationMode === 'pickup' 
      ? 'You have arrived at the pickup location!'
      : 'You have arrived at the destination!';
    
    Alert.alert('Arrived!', message, [{ text: 'OK' }]);
  }

  updateRouteProgress(currentLocation) {
    if (this.currentRoute) {
      this.currentRoute.currentLocation = currentLocation;
      this.currentRoute.distanceRemaining = this.calculateDistance(
        currentLocation,
        this.currentRoute.destination
      );
    }
  }

  startRouteUpdates() {
    this.routeUpdateInterval = setInterval(async () => {
      if (this.isNavigating && this.currentRoute) {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
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
    }, 30000);
  }

  async openExternalNavigation(destination, mode = 'driving') {
    try {
      const { latitude, longitude } = destination;
      const label = encodeURIComponent(destination.label || 'Destination');
      
      let url;
      
      if (Platform.OS === 'ios') {
        url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      } else {
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

  async getAlternativeRoutes(origin, destination) {
    try {
      const routes = [];
      
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

  getRouteName(index) {
    const names = ['Fastest Route', 'Eco-Friendly', 'Avoid Tolls'];
    return names[index] || `Route ${index + 1}`;
  }

  getRouteDescription(index) {
    const descriptions = [
      'Quickest way to destination',
      'Most fuel-efficient route',
      'Avoids toll roads',
    ];
    return descriptions[index] || 'Alternative route';
  }

  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  getStatus() {
    return {
      isNavigating: this.isNavigating,
      mode: this.navigationMode,
      currentRoute: this.currentRoute,
    };
  }

  cleanup() {
    this.stopNavigation();
    console.log('🧭 Navigation service cleaned up');
  }
}

const navigationService = new NavigationService();

export default navigationService; 