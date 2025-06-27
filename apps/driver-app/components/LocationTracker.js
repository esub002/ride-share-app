import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../utils/api';

const LocationTracker = ({ onLocationUpdate, isActive = true }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const locationSubscription = useRef(null);
  const updateInterval = useRef(null);

  useEffect(() => {
    if (isActive) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isActive]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to track your rides and provide navigation.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      setErrorMsg('Failed to request location permission');
      return false;
    }
  };

  const startLocationTracking = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      setIsTracking(true);
      setErrorMsg(null);

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      setLocation(initialLocation);
      setLastUpdate(new Date());
      
      // Send initial location to backend
      await updateLocationToBackend(initialLocation);

      // Start continuous location updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        },
        handleLocationUpdate
      );

      // Set up periodic backend updates
      updateInterval.current = setInterval(async () => {
        if (location) {
          await updateLocationToBackend(location);
        }
      }, 30000); // Update backend every 30 seconds

      console.log('📍 Location tracking started');
    } catch (error) {
      console.error('Location tracking error:', error);
      setErrorMsg('Failed to start location tracking');
      setIsTracking(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }

    setIsTracking(false);
    console.log('📍 Location tracking stopped');
  };

  const handleLocationUpdate = async (newLocation) => {
    setLocation(newLocation);
    setLastUpdate(new Date());
    
    // Notify parent component
    if (onLocationUpdate) {
      onLocationUpdate(newLocation);
    }
  };

  const updateLocationToBackend = async (locationData) => {
    try {
      const { latitude, longitude } = locationData.coords;
      
      // Update location via API
      await apiService.updateDriverLocation(latitude, longitude);
      
      console.log('📍 Location updated to backend:', { latitude, longitude });
    } catch (error) {
      console.error('Failed to update location to backend:', error);
      // Don't show error to user as this is background operation
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'No location data';
    
    const { latitude, longitude } = location.coords;
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={isTracking ? "location" : "location-outline"} 
          size={24} 
          color={isTracking ? "#4CAF50" : "#666"} 
        />
        <Text style={styles.title}>Location Tracking</Text>
        <TouchableOpacity 
          style={[styles.toggleButton, isTracking && styles.toggleButtonActive]} 
          onPress={toggleTracking}
        >
          <Text style={styles.toggleButtonText}>
            {isTracking ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color="#f44336" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <>
            <View style={styles.locationInfo}>
              <Text style={styles.label}>Current Location:</Text>
              <Text style={styles.locationText}>
                {formatLocation(location)}
              </Text>
            </View>

            <View style={styles.locationInfo}>
              <Text style={styles.label}>Last Update:</Text>
              <Text style={styles.locationText}>
                {formatLastUpdate(lastUpdate)}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, isTracking && styles.statusActive]} />
              <Text style={styles.statusText}>
                {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
              </Text>
            </View>
          </>
        )}
      </View>

      {location && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Location Details:</Text>
          <Text style={styles.detailsText}>
            Accuracy: {location.coords.accuracy?.toFixed(1)}m
          </Text>
          <Text style={styles.detailsText}>
            Speed: {location.coords.speed ? `${(location.coords.speed * 3.6).toFixed(1)} km/h` : 'N/A'}
          </Text>
          <Text style={styles.detailsText}>
            Heading: {location.coords.heading ? `${location.coords.heading.toFixed(1)}°` : 'N/A'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  toggleButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginLeft: 8,
  },
  locationInfo: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'monospace',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default LocationTracker; 