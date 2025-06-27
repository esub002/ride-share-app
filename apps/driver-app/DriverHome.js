import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Switch,
  RefreshControl,
  SafeAreaView,
  Animated,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import apiService from './utils/api';
import LoadingSpinner from './components/ui/LoadingSpinner';
import performanceOptimizer from './utils/performanceOptimizer';
import RideRequestModal from './components/RideRequestModal';
import LocationTracker from './components/LocationTracker';
import RealTimeRideRequests from './components/RealTimeRideRequests';
import RideStatusScreen from './screens/RideStatusScreen';
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing, BorderRadius, Shadows } from './constants/Spacing';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import { FontWeight } from './constants/Typography';

const { width, height } = Dimensions.get("window");

export default function DriverHome({ navigation }) {
  const [user, setUser] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showRideRequests, setShowRideRequests] = useState(false);
  const [driverStats, setDriverStats] = useState({
    totalRides: 0,
    rating: 0,
    onlineHours: 0,
    acceptanceRate: 0
  });
  const mapRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Performance optimization: Memoize expensive calculations
  const totalEarnings = performanceOptimizer.memoize('totalEarnings', () => {
    return earnings.today + earnings.week + earnings.month;
  }, [earnings]);

  // Initialize component
  useEffect(() => {
    initializeApp();
    startAnimations();
  }, []);

  // Start entrance animations
  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation for online status
    if (isAvailable) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    const setupRealTimeListeners = () => {
      // Listen for new ride requests
      apiService.socket?.on('ride:request', (newRideRequest) => {
        console.log('🚗 New ride request received:', newRideRequest);
        setRideRequests(prev => [newRideRequest, ...prev]);
        setShowRideRequests(true);
      });

      // Listen for ride status updates
      apiService.socket?.on('ride:statusUpdate', (update) => {
        console.log('📊 Ride status updated:', update);
        if (update.rideId === currentRide?.id) {
          setCurrentRide(prev => ({ ...prev, status: update.status }));
        }
      });

      // Listen for network status changes
      const status = apiService.getStatus();
      setIsOnline(status.isOnline);
    };

    setupRealTimeListeners();
  }, [currentRide]);

  const initializeApp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize API service
      await apiService.init();

      // Get user profile from API
      try {
        const userProfile = await apiService.getDriverProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Use global user if available
        setUser(global.user || {
          id: 1,
          name: 'Driver',
          phone: '+1234567890',
          car: 'Vehicle',
          email: 'driver@example.com'
        });
      }

      // Request location permissions
      await requestLocationPermission();

      // Load initial data
      await Promise.all([
        loadEarnings(),
        loadCurrentRide(),
        loadRideRequests(),
        loadDriverStats()
      ]);

    } catch (error) {
      console.error('App initialization error:', error);
      setError('Failed to initialize app. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        setError('Location permission is required for this app to function properly.');
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setError('Failed to get location permission.');
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(newLocation);
      
      // Update location on server
      if (user) {
        await apiService.updateDriverLocation(newLocation.latitude, newLocation.longitude);
      }
    } catch (error) {
      console.error('Location error:', error);
      // Don't set error for location issues as they're not critical
    }
  };

  // Load earnings data
  const loadEarnings = async () => {
    try {
      const earningsData = await apiService.getEarningsData('week');
      setEarnings(earningsData || { today: 0, week: 0, month: 0 });
    } catch (error) {
      console.error('Error loading earnings:', error);
      // Use default earnings if API fails
      setEarnings({ today: 0, week: 0, month: 0 });
    }
  };

  // Load current ride
  const loadCurrentRide = async () => {
    try {
      const currentRideData = await apiService.getCurrentRide();
      setCurrentRide(currentRideData);
    } catch (error) {
      console.error('Error loading current ride:', error);
      setCurrentRide(null);
    }
  };

  // Load ride requests
  const loadRideRequests = async () => {
    try {
      const requests = await apiService.getAvailableRides();
      setRideRequests(requests || []);
    } catch (error) {
      console.error('Error loading ride requests:', error);
      setRideRequests([]);
    }
  };

  // Load driver stats
  const loadDriverStats = async () => {
    try {
      const stats = await apiService.getDriverStats();
      setDriverStats(stats || {
        totalRides: 0,
        rating: 0,
        onlineHours: 0,
        acceptanceRate: 0
      });
    } catch (error) {
      console.error('Error loading driver stats:', error);
      setDriverStats({
        totalRides: 0,
        rating: 0,
        onlineHours: 0,
        acceptanceRate: 0
      });
    }
  };

  // Toggle availability
  const toggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      await apiService.updateAvailability(newAvailability);
      setIsAvailable(newAvailability);
      
      // Start/stop pulse animation
      if (newAvailability) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
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
      } else {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      Alert.alert('Error', 'Failed to update availability status.');
    }
  };

  // Handle ride acceptance
  const handleRideAccepted = (rideRequest) => {
    setCurrentRide(rideRequest);
    setRideRequests(prev => prev.filter(ride => ride.id !== rideRequest.id));
    setShowRideRequests(false);
  };

  // Handle ride rejection
  const handleRideRejected = (rideRequest) => {
    setRideRequests(prev => prev.filter(ride => ride.id !== rideRequest.id));
  };

  // Complete ride
  const completeRide = async () => {
    try {
      setLoading(true);
      await apiService.completeRide(currentRide.id);
      setCurrentRide(null);
      await loadEarnings(); // Refresh earnings
      Alert.alert('Success', 'Ride completed successfully!');
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle location updates
  const handleLocationUpdate = (location) => {
    setCurrentLocation(location);
    // Update location on server
    if (user) {
      apiService.updateDriverLocation(location.latitude, location.longitude);
    }
  };

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadEarnings(),
        loadCurrentRide(),
        loadRideRequests(),
        loadDriverStats()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner 
          type="pulse" 
          text="Loading Driver Dashboard..." 
          color={Colors.light.primary}
          size="large"
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Card variant="outlined" size="large" style={styles.errorCard}>
          <Ionicons name="alert-circle" size={64} color={Colors.light.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={initializeApp}
            variant="primary"
            size="medium"
            style={styles.retryButton}
          />
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Enhanced Header */}
          <Card variant="elevated" size="large" style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person" size={32} color={Colors.light.primary} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.welcomeText}>Welcome back,</Text>
                  <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
                  <Text style={styles.vehicleInfo}>{user?.car || 'Vehicle'}</Text>
                </View>
              </View>
              
              {/* Status Indicator */}
              <Animated.View 
                style={[
                  styles.statusIndicator,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isAvailable ? Colors.light.success : Colors.light.offline }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: isAvailable ? Colors.light.success : Colors.light.textSecondary }
                ]}>
                  {isAvailable ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </Animated.View>
            </View>
          </Card>

          {/* Enhanced Earnings Card */}
          <Card variant="elevated" size="large" style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <Ionicons name="cash" size={24} color={Colors.light.success} />
              <Text style={styles.earningsTitle}>Today's Earnings</Text>
            </View>
            <Text style={styles.earningsAmount}>${earnings.today?.toFixed(2) || '0.00'}</Text>
            <View style={styles.earningsBreakdown}>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>This Week</Text>
                <Text style={styles.earningsValue}>${earnings.week?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>This Month</Text>
                <Text style={styles.earningsValue}>${earnings.month?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
          </Card>

          {/* Driver Stats Grid */}
          <View style={styles.statsGrid}>
            <Card variant="default" size="small" style={styles.statCard}>
              <Ionicons name="car" size={20} color={Colors.light.primary} />
              <Text style={styles.statValue}>{driverStats.totalRides}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </Card>
            
            <Card variant="default" size="small" style={styles.statCard}>
              <Ionicons name="star" size={20} color={Colors.light.warning} />
              <Text style={styles.statValue}>{driverStats.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Card>
            
            <Card variant="default" size="small" style={styles.statCard}>
              <Ionicons name="time" size={20} color={Colors.light.info} />
              <Text style={styles.statValue}>{driverStats.onlineHours?.toFixed(1) || '0.0'}h</Text>
              <Text style={styles.statLabel}>Online</Text>
            </Card>
            
            <Card variant="default" size="small" style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
              <Text style={styles.statValue}>{driverStats.acceptanceRate?.toFixed(0) || '0'}%</Text>
              <Text style={styles.statLabel}>Acceptance</Text>
            </Card>
          </View>

          {/* Availability Toggle */}
          <Card variant="outlined" size="medium" style={styles.availabilityCard}>
            <View style={styles.availabilityContent}>
              <View style={styles.availabilityInfo}>
                <Ionicons 
                  name={isAvailable ? "radio-button-on" : "radio-button-off"} 
                  size={24} 
                  color={isAvailable ? Colors.light.success : Colors.light.textSecondary} 
                />
                <View style={styles.availabilityText}>
                  <Text style={styles.availabilityTitle}>
                    {isAvailable ? 'You are online' : 'You are offline'}
                  </Text>
                  <Text style={styles.availabilitySubtitle}>
                    {isAvailable ? 'Ready to accept rides' : 'Not accepting rides'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailability}
                trackColor={{ false: Colors.light.border, true: Colors.light.success + '40' }}
                thumbColor={isAvailable ? Colors.light.success : Colors.light.textTertiary}
                disabled={loading}
              />
            </View>
          </Card>

          {/* Location Tracker */}
          <LocationTracker 
            onLocationUpdate={handleLocationUpdate}
            isActive={isAvailable}
          />

          {/* Current Ride Status */}
          {currentRide && (
            <Card variant="elevated" size="large" style={styles.currentRideCard}>
              <View style={styles.currentRideHeader}>
                <Ionicons name="navigate" size={24} color={Colors.light.primary} />
                <Text style={styles.currentRideTitle}>Current Ride</Text>
              </View>
              <View style={styles.rideInfo}>
                <View style={styles.rideInfoItem}>
                  <Ionicons name="location" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.rideInfoText}>From: {currentRide.pickup}</Text>
                </View>
                <View style={styles.rideInfoItem}>
                  <Ionicons name="location" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.rideInfoText}>To: {currentRide.destination}</Text>
                </View>
                <View style={styles.rideInfoItem}>
                  <Ionicons name="cash" size={16} color={Colors.light.success} />
                  <Text style={styles.rideInfoText}>Fare: ${currentRide.fare}</Text>
                </View>
              </View>
              <Button
                title="Complete Ride"
                onPress={completeRide}
                loading={loading}
                variant="success"
                size="large"
                icon="checkmark"
                style={styles.completeButton}
              />
            </Card>
          )}

          {/* Ride Requests */}
          {isAvailable && rideRequests.length > 0 && (
            <Card variant="elevated" size="large" style={styles.rideRequestsCard}>
              <View style={styles.rideRequestsHeader}>
                <View style={styles.rideRequestsTitleContainer}>
                  <Ionicons name="car" size={20} color={Colors.light.primary} />
                  <Text style={styles.rideRequestsTitle}>Available Rides</Text>
                </View>
                <Button
                  title={`View All (${rideRequests.length})`}
                  onPress={() => setShowRideRequests(true)}
                  variant="outline"
                  size="small"
                  icon="list"
                />
              </View>
              
              {/* Show first ride request as preview */}
              {rideRequests.slice(0, 1).map((ride) => (
                <View key={ride.id} style={styles.rideRequestPreview}>
                  <View style={styles.rideRequestInfo}>
                    <Text style={styles.rideRequestText}>
                      {ride.pickup} → {ride.destination}
                    </Text>
                    <Text style={styles.rideRequestTime}>2 min ago</Text>
                  </View>
                  <Text style={styles.rideRequestFare}>${ride.fare}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Map View */}
          {currentLocation && (
            <Card variant="elevated" size="large" style={styles.mapCard}>
              <View style={styles.mapHeader}>
                <Ionicons name="map" size={20} color={Colors.light.primary} />
                <Text style={styles.mapTitle}>Live Location</Text>
              </View>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {/* Driver location marker */}
                <Marker
                  coordinate={currentLocation}
                  title="Your Location"
                  description="Driver location"
                >
                  <View style={styles.driverMarker}>
                    <Ionicons name="car" size={24} color={Colors.light.primary} />
                  </View>
                </Marker>

                {/* Current ride route */}
                {currentRide && currentRide.pickup && currentRide.destination && (
                  <>
                    <Marker
                      coordinate={{
                        latitude: currentRide.pickup.latitude,
                        longitude: currentRide.pickup.longitude,
                      }}
                      title="Pickup"
                      pinColor="green"
                    />
                    <Marker
                      coordinate={{
                        latitude: currentRide.destination.latitude,
                        longitude: currentRide.destination.longitude,
                      }}
                      title="Destination"
                      pinColor="red"
                    />
                  </>
                )}
              </MapView>
            </Card>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('EarningsFinance')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="cash" size={24} color={Colors.light.success} />
              </View>
              <Text style={styles.actionButtonText}>Earnings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('TripHistory')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="time" size={24} color={Colors.light.warning} />
              </View>
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('SafetyFeatures')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="shield" size={24} color={Colors.light.error} />
              </View>
              <Text style={styles.actionButtonText}>Safety</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="settings" size={24} color={Colors.light.textSecondary} />
              </View>
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Real-time Ride Requests Modal */}
      <Modal
        visible={showRideRequests}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <RealTimeRideRequests
          rideRequests={rideRequests}
          onAccept={handleRideAccepted}
          onReject={handleRideRejected}
          onClose={() => setShowRideRequests(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
    backgroundColor: Colors.light.background,
  },
  errorCard: {
    padding: Spacing.large,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.medium,
  },
  retryButton: {
    marginTop: Spacing.medium,
  },
  headerCard: {
    margin: Spacing.medium,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.circular,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  userDetails: {
    marginLeft: Spacing.medium,
  },
  welcomeText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xsmall,
  },
  driverName: {
    ...Typography.h2,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xsmall,
  },
  vehicleInfo: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.circular,
    marginRight: Spacing.small,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: FontWeight.semiBold,
  },
  earningsCard: {
    margin: Spacing.medium,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  earningsTitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginLeft: Spacing.small,
  },
  earningsAmount: {
    ...Typography.h1,
    color: Colors.light.success,
    marginBottom: Spacing.medium,
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsItem: {
    flex: 1,
  },
  earningsLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xsmall,
  },
  earningsValue: {
    ...Typography.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.light.success,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: Spacing.medium,
    gap: Spacing.small,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.medium,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.light.textPrimary,
    marginVertical: Spacing.small,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  availabilityCard: {
    margin: Spacing.medium,
  },
  availabilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    marginLeft: Spacing.medium,
  },
  availabilityTitle: {
    ...Typography.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xsmall,
  },
  availabilitySubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  currentRideCard: {
    margin: Spacing.medium,
  },
  currentRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  currentRideTitle: {
    ...Typography.h3,
    color: Colors.light.textPrimary,
    marginLeft: Spacing.small,
  },
  rideInfo: {
    marginBottom: Spacing.medium,
  },
  rideInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  rideInfoText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginLeft: Spacing.small,
  },
  completeButton: {
    marginTop: Spacing.medium,
  },
  rideRequestsCard: {
    margin: Spacing.medium,
  },
  rideRequestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  rideRequestsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideRequestsTitle: {
    ...Typography.h3,
    color: Colors.light.textPrimary,
    marginLeft: Spacing.small,
  },
  rideRequestPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  rideRequestInfo: {
    flex: 1,
  },
  rideRequestText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xsmall,
  },
  rideRequestTime: {
    ...Typography.caption,
    color: Colors.light.textTertiary,
  },
  rideRequestFare: {
    ...Typography.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.light.success,
  },
  mapCard: {
    margin: Spacing.medium,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  mapTitle: {
    ...Typography.h3,
    color: Colors.light.textPrimary,
    marginLeft: Spacing.small,
  },
  map: {
    height: 300,
    borderRadius: BorderRadius.medium,
  },
  driverMarker: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.circular,
    padding: Spacing.xsmall,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    ...Shadows.small,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    marginTop: Spacing.medium,
  },
  actionButton: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  actionIcon: {
    marginRight: Spacing.small,
  },
  actionButtonText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
});
