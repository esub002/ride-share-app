import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

function haversineDistance(coord1, coord2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // meters
  const φ1 = toRad(coord1.latitude);
  const φ2 = toRad(coord2.latitude);
  const Δφ = toRad(coord2.latitude - coord1.latitude);
  const Δλ = toRad(coord2.longitude - coord1.longitude);
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in meters
}

export default function EnhancedRideRequestModal({
  visible,
  onAccept,
  onReject,
  driverLocation,
  pickupLocation,
  dropoffLocation,
  rideRequest,
  loading = false,
}) {
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds to respond
  const [isExpanded, setIsExpanded] = useState(false);
  
  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const timerRef = useRef(null);

  const riderName = rideRequest?.riderName || 'Rider';
  const pickupAddress = rideRequest?.pickup || 'Pickup Location';
  const dropoffAddress = rideRequest?.destination || 'Destination';

  useEffect(() => {
    if (visible) {
      startEntranceAnimation();
      startPulseAnimation();
      startTimer();
      triggerHapticFeedback();
    } else {
      resetAnimations();
      clearTimer();
    }
  }, [visible]);

  useEffect(() => {
    if (driverLocation && pickupLocation) {
      calculateRideDetails();
      fitMapToMarkers();
    }
  }, [driverLocation, pickupLocation]);

  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const triggerHapticFeedback = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate([0, 200, 100, 200]); // Custom vibration pattern
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  };

  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startTimer = () => {
    setTimeRemaining(30);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          onReject(); // Auto-reject when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetAnimations = () => {
    slideAnim.setValue(height);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    pulseAnim.setValue(1);
    shakeAnim.setValue(0);
  };

  const calculateRideDetails = () => {
    const distMeters = haversineDistance(driverLocation, pickupLocation);
    const distanceMiles = (distMeters / 1609.34).toFixed(1);
    setDistance(distanceMiles);
    
    // Calculate ETA (assume 25 mph average speed)
    const etaMinutes = Math.ceil((distanceMiles / 25) * 60);
    setEta(etaMinutes);
    
    // Calculate estimated fare (base fare + distance + time)
    const baseFare = 5.00;
    const distanceFare = distanceMiles * 2.50;
    const timeFare = etaMinutes * 0.25;
    const totalFare = (baseFare + distanceFare + timeFare).toFixed(2);
    setEstimatedFare(totalFare);
  };

  const fitMapToMarkers = () => {
    setTimeout(() => {
      if (mapRef.current && driverLocation && pickupLocation) {
        const coordinates = [driverLocation, pickupLocation];
        if (dropoffLocation) {
          coordinates.push(dropoffLocation);
        }
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }, 500);
  };

  const handleAccept = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      clearTimer();
      onAccept();
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const handleReject = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startShakeAnimation();
      clearTimer();
      onReject();
    } catch (error) {
      console.error('Error rejecting ride:', error);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.spring(scaleAnim, {
      toValue: isExpanded ? 1 : 1.02,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const getTimeColor = () => {
    if (timeRemaining <= 10) return '#FF5722';
    if (timeRemaining <= 20) return '#FF9800';
    return '#4CAF50';
  };

  const getTimeEmoji = () => {
    if (timeRemaining <= 5) return '⚡';
    if (timeRemaining <= 15) return '⏰';
    return '🕐';
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleReject}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Header with urgent timer */}
          <Animated.View
            style={[
              styles.header,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>🚗 New Ride Request!</Text>
                <Text style={styles.subtitle}>from {riderName}</Text>
              </View>
              <Animated.View
                style={[
                  styles.timerContainer,
                  {
                    transform: [{ translateX: shakeAnim }],
                  },
                ]}
              >
                <Text style={[styles.timerText, { color: getTimeColor() }]}>
                  {getTimeEmoji()} {timeRemaining}s
                </Text>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Map Section */}
          <View style={styles.mapContainer}>
            {driverLocation && pickupLocation ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: (driverLocation.latitude + pickupLocation.latitude) / 2,
                  longitude: (driverLocation.longitude + pickupLocation.longitude) / 2,
                  latitudeDelta: Math.abs(driverLocation.latitude - pickupLocation.latitude) + 0.02,
                  longitudeDelta: Math.abs(driverLocation.longitude - pickupLocation.longitude) + 0.02,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                showsScale={false}
                showsTraffic={true}
                pointerEvents="none"
              >
                {/* Driver location marker */}
                <Marker coordinate={driverLocation} title="Your Location">
                  <View style={styles.driverMarker}>
                    <Ionicons name="car" size={24} color="#1976d2" />
                  </View>
                </Marker>

                {/* Pickup location marker */}
                <Marker coordinate={pickupLocation} title="Pickup Location">
                  <View style={styles.pickupMarker}>
                    <Ionicons name="location" size={24} color="#4CAF50" />
                  </View>
                </Marker>

                {/* Dropoff location marker */}
                {dropoffLocation && (
                  <Marker coordinate={dropoffLocation} title="Dropoff Location">
                    <View style={styles.dropoffMarker}>
                      <Ionicons name="flag" size={24} color="#FF5722" />
                    </View>
                  </Marker>
                )}

                {/* Route polyline */}
                <Polyline
                  coordinates={[driverLocation, pickupLocation]}
                  strokeWidth={4}
                  strokeColor="#1976d2"
                  lineDashPattern={[10, 5]}
                />
              </MapView>
            ) : (
              <View style={styles.loadingMap}>
                <ActivityIndicator size="large" color="#1976d2" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>

          {/* Ride Details */}
          <View style={styles.detailsContainer}>
            <TouchableOpacity onPress={toggleExpanded} style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>📍 Ride Details</Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            <View style={styles.detailsContent}>
              <View style={styles.locationRow}>
                <View style={styles.locationIcon}>
                  <Ionicons name="location" size={16} color="#4CAF50" />
                </View>
                <View style={styles.locationText}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress}>{pickupAddress}</Text>
                </View>
              </View>

              {dropoffLocation && (
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <Ionicons name="flag" size={16} color="#FF5722" />
                  </View>
                  <View style={styles.locationText}>
                    <Text style={styles.locationLabel}>Dropoff</Text>
                    <Text style={styles.locationAddress}>{dropoffAddress}</Text>
                  </View>
                </View>
              )}

              {isExpanded && (
                <Animated.View
                  style={[
                    styles.expandedDetails,
                    {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Ionicons name="navigate" size={20} color="#1976d2" />
                      <Text style={styles.statValue}>{distance} mi</Text>
                      <Text style={styles.statLabel}>Distance</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={20} color="#FF9800" />
                      <Text style={styles.statValue}>{eta} min</Text>
                      <Text style={styles.statLabel}>ETA</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="cash" size={20} color="#4CAF50" />
                      <Text style={styles.statValue}>${estimatedFare}</Text>
                      <Text style={styles.statLabel}>Est. Fare</Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>

          {/* Loading overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingOverlayText}>Processing...</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: height * 0.7,
    maxHeight: height * 0.9,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#1976d2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 200,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  pickupMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  dropoffMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  detailsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF5722',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  loadingOverlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
}); 