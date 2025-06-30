import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import EnhancedMapComponent from '../components/EnhancedMapComponent';
import NavControls from '../components/NavControls';
import navigationService from '../utils/navigationService';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

const EnhancedNavigationScreen = ({ route, navigation }) => {
  const { ride, onRideComplete } = route.params || {};
  const [navigationMode, setNavigationMode] = useState('pickup');
  const [showTraffic, setShowTraffic] = useState(true);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStatus, setNavigationStatus] = useState('idle');
  const [rideInfo, setRideInfo] = useState(null);
  const [showRideInfo, setShowRideInfo] = useState(false);

  useEffect(() => {
    initializeNavigation();
    if (ride) {
      setRideInfo(ride);
    }
  }, [ride]);

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
    
    if (navigationMode === 'pickup') {
      setNavigationMode('dropoff');
      setIsNavigating(true);
      navigationService.startNavigation(
        { latitude: ride.destination_lat, longitude: ride.destination_lng },
        'dropoff'
      );
      Alert.alert(
        'Pickup Complete',
        'You have picked up the rider. Starting navigation to destination.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Ride Completed!',
        'The ride has been completed successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setNavigationStatus('idle');
              setIsNavigating(false);
              if (onRideComplete) {
                onRideComplete(ride);
              }
              navigation.goBack();
            }
          }
        ]
      );
    }
  };

  const handleNavigationCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Cancel Navigation',
      'Are you sure you want to cancel navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            navigationService.stopNavigation();
            setNavigationStatus('idle');
            setIsNavigating(false);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleModeChange = (mode) => {
    setNavigationMode(mode);
    setNavigationStatus('idle');
    setIsNavigating(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTrafficToggle = (value) => {
    setShowTraffic(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAlternativesToggle = (value) => {
    setShowAlternatives(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startNavigation = async () => {
    try {
      setIsNavigating(true);
      setNavigationStatus('navigating');
      
      const destination = navigationMode === 'pickup' 
        ? { latitude: ride.pickup_lat, longitude: ride.pickup_lng }
        : { latitude: ride.destination_lat, longitude: ride.destination_lng };

      await navigationService.startNavigation(destination, navigationMode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('🧭 Failed to start navigation:', error);
      setIsNavigating(false);
      setNavigationStatus('idle');
    }
  };

  const getStatusColor = () => {
    switch (navigationStatus) {
      case 'navigating': return '#2196F3';
      case 'arrived': return '#4CAF50';
      case 'error': return '#FF5722';
      default: return '#666';
    }
  };

  const getStatusText = () => {
    switch (navigationStatus) {
      case 'navigating': return 'Navigating...';
      case 'arrived': return 'Arrived!';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  const getNavigationTitle = () => {
    return navigationMode === 'pickup' ? 'Navigate to Pickup' : 'Navigate to Destination';
  };

  const getDestinationAddress = () => {
    return navigationMode === 'pickup' ? ride?.pickup : ride?.destination;
  };

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF5722" />
          <Text style={styles.errorText}>No ride data available</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getNavigationTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getDestinationAddress()}</Text>
        </View>
        
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.rideInfoButton}
        onPress={() => setShowRideInfo(true)}
      >
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.rideInfoButtonText}>Ride Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        <EnhancedMapComponent
          ride={ride}
          onComplete={handleRideComplete}
          onCancel={handleNavigationCancel}
          showTraffic={showTraffic}
          showAlternatives={showAlternatives}
        />
      </View>

      <NavControls
        ride={ride}
        navigationMode={navigationMode}
        onModeChange={handleModeChange}
        showTraffic={showTraffic}
        onTrafficToggle={handleTrafficToggle}
        showAlternatives={showAlternatives}
        onAlternativesToggle={handleAlternativesToggle}
      />

      <View style={styles.startNavigationContainer}>
        <TouchableOpacity
          style={[styles.startNavigationButton, isNavigating && styles.startNavigationButtonActive]}
          onPress={startNavigation}
          disabled={isNavigating}
        >
          <Ionicons 
            name={isNavigating ? "pause" : "play"} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.startNavigationButtonText}>
            {isNavigating ? 'Stop' : 'Start'} Navigation
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showRideInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRideInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ride Details</Text>
              <TouchableOpacity onPress={() => setShowRideInfo(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.rideDetailSection}>
                <Text style={styles.sectionTitle}>Pickup</Text>
                <View style={styles.rideDetailItem}>
                  <Ionicons name="location" size={16} color="#4CAF50" />
                  <Text style={styles.rideDetailText}>{ride.pickup}</Text>
                </View>
              </View>

              <View style={styles.rideDetailSection}>
                <Text style={styles.sectionTitle}>Destination</Text>
                <View style={styles.rideDetailItem}>
                  <Ionicons name="flag" size={16} color="#FF5722" />
                  <Text style={styles.rideDetailText}>{ride.destination}</Text>
                </View>
              </View>

              {ride.rider && (
                <View style={styles.rideDetailSection}>
                  <Text style={styles.sectionTitle}>Rider</Text>
                  <View style={styles.rideDetailItem}>
                    <Ionicons name="person" size={16} color="#2196F3" />
                    <Text style={styles.rideDetailText}>
                      {ride.rider.name} {ride.rider.rating && `(⭐ ${ride.rider.rating})`}
                    </Text>
                  </View>
                  {ride.rider.phone && (
                    <View style={styles.rideDetailItem}>
                      <Ionicons name="call" size={16} color="#2196F3" />
                      <Text style={styles.rideDetailText}>{ride.rider.phone}</Text>
                    </View>
                  )}
                </View>
              )}

              {ride.fare && (
                <View style={styles.rideDetailSection}>
                  <Text style={styles.sectionTitle}>Fare</Text>
                  <View style={styles.rideDetailItem}>
                    <Ionicons name="card" size={16} color="#FF9800" />
                    <Text style={styles.rideDetailText}>${ride.fare}</Text>
                  </View>
                </View>
              )}

              {ride.estimatedDuration && (
                <View style={styles.rideDetailSection}>
                  <Text style={styles.sectionTitle}>Estimated Duration</Text>
                  <View style={styles.rideDetailItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.rideDetailText}>{ride.estimatedDuration} minutes</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rideInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rideInfoButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startNavigationContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  startNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 12,
  },
  startNavigationButtonActive: {
    backgroundColor: '#FF5722',
  },
  startNavigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  rideDetailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  rideDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideDetailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
});

export default EnhancedNavigationScreen; 