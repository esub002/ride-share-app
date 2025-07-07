import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';

// Import our enhanced services
import enhancedRealTimeManager from '../utils/enhancedRealTimeManager';
import apiService from '../utils/api';

const { width, height } = Dimensions.get('window');

const AdvancedLocationTracking = () => {
  // State management
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [activeGeofences, setActiveGeofences] = useState(new Set());
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(0);
  const [locationSpeed, setLocationSpeed] = useState(0);
  const [locationHeading, setLocationHeading] = useState(0);
  const [geofenceEvents, setGeofenceEvents] = useState([]);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [locationPermissions, setLocationPermissions] = useState(false);

  // Animation refs
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const geofenceAnimation = useRef(new Animated.Value(0)).current;

  // Refs for cleanup
  const locationSubscription = useRef(null);
  const geofenceCheckInterval = useRef(null);
  const mapRef = useRef(null);

  // Initialize location tracking
  useEffect(() => {
    initializeLocationTracking();
    setupEventListeners();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize location tracking
  const initializeLocationTracking = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to provide ride services.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLocationPermissions(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        timestamp: new Date().toISOString(),
      });

      // Load geofences
      await loadGeofences();

      // Connect to real-time manager
      await enhancedRealTimeManager.connect();

      console.log('📍 Advanced location tracking initialized');
    } catch (error) {
      console.error('📍 Failed to initialize location tracking:', error);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // Location updates from real-time manager
    enhancedRealTimeManager.on('location:updated', (location) => {
      handleLocationUpdate(location);
    });

    // Geofence events
    enhancedRealTimeManager.on('geofence:entered', (data) => {
      handleGeofenceEntered(data);
    });

    enhancedRealTimeManager.on('geofence:exited', (data) => {
      handleGeofenceExited(data);
    });

    // Route updates
    enhancedRealTimeManager.on('route:updated', (route) => {
      handleRouteUpdate(route);
    });

    // Location accuracy updates
    enhancedRealTimeManager.on('location:accuracy', (accuracy) => {
      setLocationAccuracy(accuracy);
    });
  };

  // Start location tracking
  const startLocationTracking = async () => {
    if (!locationPermissions) {
      Alert.alert('Location Permission Required', 'Please enable location permissions first.');
      return;
    }

    try {
      setTrackingEnabled(true);

      // Start watching position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          handleLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: new Date().toISOString(),
          });
        }
      );

      // Start geofence checking
      startGeofenceChecking();

      // Send location to server
      if (currentLocation) {
        await sendLocationToServer(currentLocation);
      }

      console.log('📍 Location tracking started');
    } catch (error) {
      console.error('📍 Error starting location tracking:', error);
      setTrackingEnabled(false);
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    setTrackingEnabled(false);

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (geofenceCheckInterval.current) {
      clearInterval(geofenceCheckInterval.current);
      geofenceCheckInterval.current = null;
    }

    console.log('📍 Location tracking stopped');
  };

  // Handle location update
  const handleLocationUpdate = useCallback((location) => {
    setCurrentLocation(location);
    setLocationAccuracy(location.accuracy);
    setLocationSpeed(location.speed || 0);
    setLocationHeading(location.heading || 0);

    // Add to location history
    setLocationHistory(prev => [...prev, location].slice(-100));

    // Send to real-time manager
    enhancedRealTimeManager.updateLocation(location.latitude, location.longitude);

    // Check geofences
    checkGeofences(location);

    // Trigger pulse animation
    triggerPulseAnimation();

    // Update map if visible
    if (showMap && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [showMap]);

  // Send location to server
  const sendLocationToServer = async (location) => {
    try {
      await apiService.updateLocation(location);
    } catch (error) {
      console.error('📍 Error sending location to server:', error);
    }
  };

  // Load geofences
  const loadGeofences = async () => {
    try {
      const geofencesData = await apiService.getGeofences();
      setGeofences(geofencesData);
    } catch (error) {
      console.error('📍 Error loading geofences:', error);
    }
  };

  // Start geofence checking
  const startGeofenceChecking = () => {
    geofenceCheckInterval.current = setInterval(() => {
      if (currentLocation) {
        checkGeofences(currentLocation);
      }
    }, 10000); // Check every 10 seconds
  };

  // Check geofences
  const checkGeofences = (location) => {
    geofences.forEach(geofence => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        geofence.latitude,
        geofence.longitude
      );

      const isInside = distance <= geofence.radius;
      const wasInside = activeGeofences.has(geofence.id);

      if (isInside && !wasInside) {
        handleGeofenceEntered(geofence);
      } else if (!isInside && wasInside) {
        handleGeofenceExited(geofence);
      }
    });
  };

  // Handle geofence entered
  const handleGeofenceEntered = (geofence) => {
    setActiveGeofences(prev => new Set([...prev, geofence.id]));
    
    setGeofenceEvents(prev => [{
      type: 'entered',
      geofence,
      timestamp: new Date().toISOString(),
    }, ...prev].slice(-20));

    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show notification
    Alert.alert(
      'Geofence Entered',
      `You have entered: ${geofence.name}`,
      [{ text: 'OK' }]
    );

    // Send to real-time manager
    enhancedRealTimeManager.handleGeofenceEntered(geofence);

    // Trigger animation
    triggerGeofenceAnimation();

    console.log('📍 Entered geofence:', geofence.name);
  };

  // Handle geofence exited
  const handleGeofenceExited = (geofence) => {
    setActiveGeofences(prev => {
      const newSet = new Set(prev);
      newSet.delete(geofence.id);
      return newSet;
    });

    setGeofenceEvents(prev => [{
      type: 'exited',
      geofence,
      timestamp: new Date().toISOString(),
    }, ...prev].slice(-20));

    // Send to real-time manager
    enhancedRealTimeManager.handleGeofenceExited(geofence);

    console.log('📍 Exited geofence:', geofence.name);
  };

  // Handle route update
  const handleRouteUpdate = (route) => {
    setRoutePolyline(route.coordinates);
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Toggle map visibility
  const toggleMap = () => {
    setShowMap(!showMap);
    Animated.timing(slideAnimation, {
      toValue: showMap ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Trigger pulse animation
  const triggerPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Trigger geofence animation
  const triggerGeofenceAnimation = () => {
    Animated.sequence([
      Animated.timing(geofenceAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(geofenceAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Get accuracy color
  const getAccuracyColor = (accuracy) => {
    if (accuracy <= 5) return '#00AA00';
    if (accuracy <= 20) return '#FFAA00';
    return '#FF4444';
  };

  // Get speed color
  const getSpeedColor = (speed) => {
    if (speed <= 30) return '#00AA00';
    if (speed <= 60) return '#FFAA00';
    return '#FF4444';
  };

  // Cleanup
  const cleanup = () => {
    stopLocationTracking();
    
    enhancedRealTimeManager.off('location:updated');
    enhancedRealTimeManager.off('geofence:entered');
    enhancedRealTimeManager.off('geofence:exited');
    enhancedRealTimeManager.off('route:updated');
    enhancedRealTimeManager.off('location:accuracy');
  };

  // Render location info
  const renderLocationInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Current Location</Text>
      <View style={styles.locationGrid}>
        <View style={styles.locationCard}>
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.locationLabel}>Coordinates</Text>
          <Text style={styles.locationValue}>
            {currentLocation ? 
              `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : 
              'Not available'
            }
          </Text>
        </View>

        <View style={[styles.locationCard, { borderLeftColor: getAccuracyColor(locationAccuracy) }]}>
          <Ionicons name="compass" size={20} color={getAccuracyColor(locationAccuracy)} />
          <Text style={styles.locationLabel}>Accuracy</Text>
          <Text style={[styles.locationValue, { color: getAccuracyColor(locationAccuracy) }]}>
            {locationAccuracy ? `${locationAccuracy.toFixed(1)}m` : 'N/A'}
          </Text>
        </View>

        <View style={[styles.locationCard, { borderLeftColor: getSpeedColor(locationSpeed) }]}>
          <Ionicons name="speedometer" size={20} color={getSpeedColor(locationSpeed)} />
          <Text style={styles.locationLabel}>Speed</Text>
          <Text style={[styles.locationValue, { color: getSpeedColor(locationSpeed) }]}>
            {locationSpeed ? `${(locationSpeed * 3.6).toFixed(1)} km/h` : 'N/A'}
          </Text>
        </View>

        <View style={styles.locationCard}>
          <Ionicons name="navigate" size={20} color="#007AFF" />
          <Text style={styles.locationLabel}>Heading</Text>
          <Text style={styles.locationValue}>
            {locationHeading ? `${locationHeading.toFixed(0)}°` : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render geofences
  const renderGeofences = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Active Geofences</Text>
      <ScrollView style={styles.geofencesContainer} showsVerticalScrollIndicator={false}>
        {geofences.map(geofence => (
          <View
            key={geofence.id}
            style={[
              styles.geofenceItem,
              {
                borderLeftColor: activeGeofences.has(geofence.id) ? '#00AA00' : '#CCCCCC',
                backgroundColor: activeGeofences.has(geofence.id) ? '#F0FFF0' : '#F8F9FA',
              }
            ]}
          >
            <View style={styles.geofenceHeader}>
              <Ionicons
                name={activeGeofences.has(geofence.id) ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={activeGeofences.has(geofence.id) ? '#00AA00' : '#CCCCCC'}
              />
              <Text style={styles.geofenceName}>{geofence.name}</Text>
              <Text style={styles.geofenceRadius}>{geofence.radius}m</Text>
            </View>
            <Text style={styles.geofenceDescription}>{geofence.description}</Text>
          </View>
        ))}
        {geofences.length === 0 && (
          <Text style={styles.noGeofences}>No geofences configured</Text>
        )}
      </ScrollView>
    </View>
  );

  // Render geofence events
  const renderGeofenceEvents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Events</Text>
      <ScrollView style={styles.eventsContainer} showsVerticalScrollIndicator={false}>
        {geofenceEvents.map((event, index) => (
          <Animated.View
            key={index}
            style={[
              styles.eventItem,
              {
                borderLeftColor: event.type === 'entered' ? '#00AA00' : '#FFAA00',
                transform: [{ scale: geofenceAnimation }]
              }
            ]}
          >
            <View style={styles.eventHeader}>
              <Ionicons
                name={event.type === 'entered' ? 'enter' : 'exit'}
                size={16}
                color={event.type === 'entered' ? '#00AA00' : '#FFAA00'}
              />
              <Text style={styles.eventType}>
                {event.type === 'entered' ? 'Entered' : 'Exited'}
              </Text>
              <Text style={styles.eventTime}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.eventGeofence}>{event.geofence.name}</Text>
          </Animated.View>
        ))}
        {geofenceEvents.length === 0 && (
          <Text style={styles.noEvents}>No recent events</Text>
        )}
      </ScrollView>
    </View>
  );

  // Render map
  const renderMap = () => (
    <Animated.View
      style={[
        styles.mapContainer,
        {
          maxHeight: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 300],
          }),
          opacity: slideAnimation,
        },
      ]}
    >
      {currentLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Current location marker */}
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description={`Accuracy: ${locationAccuracy.toFixed(1)}m`}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
              <Ionicons name="location" size={30} color="#007AFF" />
            </Animated.View>
          </Marker>

          {/* Geofences */}
          {geofences.map(geofence => (
            <Circle
              key={geofence.id}
              center={{
                latitude: geofence.latitude,
                longitude: geofence.longitude,
              }}
              radius={geofence.radius}
              strokeColor={activeGeofences.has(geofence.id) ? '#00AA00' : '#CCCCCC'}
              strokeWidth={2}
              fillColor={activeGeofences.has(geofence.id) ? '#00AA0020' : '#CCCCCC20'}
            />
          ))}

          {/* Route polyline */}
          {routePolyline.length > 0 && (
            <Polyline
              coordinates={routePolyline}
              strokeColor="#007AFF"
              strokeWidth={3}
            />
          )}
        </MapView>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="location" size={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Advanced Location Tracking</Text>
        </View>
        <TouchableOpacity
          style={[styles.trackingButton, { backgroundColor: trackingEnabled ? '#FF4444' : '#00AA00' }]}
          onPress={trackingEnabled ? stopLocationTracking : startLocationTracking}
        >
          <Ionicons
            name={trackingEnabled ? 'stop' : 'play'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.trackingButtonText}>
            {trackingEnabled ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderLocationInfo()}
        {renderGeofences()}
        {renderGeofenceEvents()}
      </ScrollView>

      <TouchableOpacity style={styles.mapToggle} onPress={toggleMap}>
        <Ionicons name={showMap ? "chevron-down" : "chevron-up"} size={20} color="#007AFF" />
        <Text style={styles.mapToggleText}>
          {showMap ? 'Hide Map' : 'Show Map'}
        </Text>
      </TouchableOpacity>

      {renderMap()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackingButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  locationCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  geofencesContainer: {
    maxHeight: 200,
  },
  geofenceItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  geofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  geofenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 4,
  },
  geofenceRadius: {
    fontSize: 12,
    color: '#666',
  },
  geofenceDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  noGeofences: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  eventsContainer: {
    maxHeight: 200,
  },
  eventItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
  eventGeofence: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  noEvents: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  mapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  mapToggleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  mapContainer: {
    overflow: 'hidden',
  },
  map: {
    height: 300,
  },
});

export default AdvancedLocationTracking; 