import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import EnhancedMapComponent from './EnhancedMapComponent';
import NavControls from './NavControls';
import navigationService from '../utils/navigationService';

const NavigationIntegrationExample = () => {
  const [ride, setRide] = useState(null);
  const [navigationMode, setNavigationMode] = useState('pickup');
  const [showTraffic, setShowTraffic] = useState(true);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStatus, setNavigationStatus] = useState('idle');

  // Mock ride data for demonstration
  const mockRide = {
    id: 'ride_123',
    pickup: '123 Main St, San Francisco, CA',
    pickup_lat: 37.78825,
    pickup_lng: -122.4324,
    destination: '456 Market St, San Francisco, CA',
    destination_lat: 37.7849,
    destination_lng: -122.4094,
    rider: {
      name: 'John Doe',
      phone: '+1-555-0123',
      rating: 4.8,
    },
    fare: 25.50,
    estimatedDuration: 15,
  };

  useEffect(() => {
    initializeNavigation();
    setRide(mockRide);
  }, []);

  const initializeNavigation = async () => {
    try {
      await navigationService.init();
      console.log('🧭 Navigation service initialized successfully');
    } catch (error) {
      console.error('🧭 Failed to initialize navigation service:', error);
      Alert.alert(
        'Navigation Error',
        'Failed to initialize navigation. Please check location permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRideComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Ride Completed!',
      'The ride has been completed successfully.',
      [
        {
          text: 'OK',
          onPress: () => {
            setNavigationStatus('idle');
            setIsNavigating(false);
            // Reset to pickup mode for next ride
            setNavigationMode('pickup');
          }
        }
      ]
    );
  };

  const handleNavigationCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Cancel Navigation',
      'Are you sure you want to cancel navigation?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: () => {
            navigationService.stopNavigation();
            setNavigationStatus('idle');
            setIsNavigating(false);
          }
        }
      ]
    );
  };

  const handleModeChange = (mode) => {
    setNavigationMode(mode);
    setNavigationStatus('idle');
    setIsNavigating(false);
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    console.log(`🧭 Navigation mode changed to: ${mode}`);
  };

  const handleTrafficToggle = (value) => {
    setShowTraffic(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log(`🧭 Traffic display ${value ? 'enabled' : 'disabled'}`);
  };

  const handleAlternativesToggle = (value) => {
    setShowAlternatives(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log(`🧭 Alternative routes ${value ? 'enabled' : 'disabled'}`);
  };

  const startTestNavigation = async () => {
    try {
      setIsNavigating(true);
      setNavigationStatus('navigating');
      
      const destination = navigationMode === 'pickup' 
        ? { latitude: ride.pickup_lat, longitude: ride.pickup_lng }
        : { latitude: ride.destination_lat, longitude: ride.destination_lng };

      await navigationService.startNavigation(destination, navigationMode);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('🧭 Test navigation started');
    } catch (error) {
      console.error('🧭 Failed to start test navigation:', error);
      setIsNavigating(false);
      setNavigationStatus('idle');
    }
  };

  const getStatusColor = () => {
    switch (navigationStatus) {
      case 'navigating':
        return '#2196F3';
      case 'arrived':
        return '#4CAF50';
      case 'error':
        return '#FF5722';
      default:
        return '#666';
    }
  };

  const getStatusText = () => {
    switch (navigationStatus) {
      case 'navigating':
        return 'Navigating...';
      case 'arrived':
        return 'Arrived!';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading navigation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="car" size={24} color="#2196F3" />
          <Text style={styles.headerTitle}>Enhanced Navigation Demo</Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Ride Info */}
      <View style={styles.rideInfo}>
        <View style={styles.rideHeader}>
          <Text style={styles.rideTitle}>Current Ride</Text>
          <Text style={styles.rideId}>#{ride.id}</Text>
        </View>
        
        <View style={styles.rideDetails}>
          <View style={styles.rideDetail}>
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.rideDetailText}>
              <Text style={styles.rideDetailLabel}>Pickup: </Text>
              {ride.pickup}
            </Text>
          </View>
          
          <View style={styles.rideDetail}>
            <Ionicons name="flag" size={16} color="#FF5722" />
            <Text style={styles.rideDetailText}>
              <Text style={styles.rideDetailLabel}>Destination: </Text>
              {ride.destination}
            </Text>
          </View>
          
          <View style={styles.rideDetail}>
            <Ionicons name="person" size={16} color="#2196F3" />
            <Text style={styles.rideDetailText}>
              <Text style={styles.rideDetailLabel}>Rider: </Text>
              {ride.rider.name} (⭐ {ride.rider.rating})
            </Text>
          </View>
          
          <View style={styles.rideDetail}>
            <Ionicons name="card" size={16} color="#FF9800" />
            <Text style={styles.rideDetailText}>
              <Text style={styles.rideDetailLabel}>Fare: </Text>
              ${ride.fare}
            </Text>
          </View>
        </View>
      </View>

      {/* Enhanced Map Component */}
      <View style={styles.mapContainer}>
        <EnhancedMapComponent
          ride={ride}
          onComplete={handleRideComplete}
          onCancel={handleNavigationCancel}
          showTraffic={showTraffic}
          showAlternatives={showAlternatives}
        />
      </View>

      {/* Navigation Controls */}
      <NavControls
        ride={ride}
        navigationMode={navigationMode}
        onModeChange={handleModeChange}
        showTraffic={showTraffic}
        onTrafficToggle={handleTrafficToggle}
        showAlternatives={showAlternatives}
        onAlternativesToggle={handleAlternativesToggle}
      />

      {/* Test Controls */}
      <View style={styles.testControls}>
        <TouchableOpacity
          style={[styles.testButton, isNavigating && styles.testButtonActive]}
          onPress={startTestNavigation}
          disabled={isNavigating}
        >
          <Ionicons 
            name={isNavigating ? "pause" : "play"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.testButtonText}>
            {isNavigating ? 'Stop' : 'Start'} Test Navigation
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => {
            Alert.alert(
              'Navigation Demo',
              'This is a demonstration of the enhanced navigation system. Features include:\n\n• Real-time traffic data\n• Alternative routes\n• External navigation apps\n• Turn-by-turn directions\n• Haptic feedback\n• Background location tracking',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.infoButtonText}>Info</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rideInfo: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rideId: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  rideDetails: {
    gap: 8,
  },
  rideDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideDetailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  rideDetailLabel: {
    fontWeight: '600',
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  testControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
  },
  testButtonActive: {
    backgroundColor: '#FF5722',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
  },
  infoButtonText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default NavigationIntegrationExample; 