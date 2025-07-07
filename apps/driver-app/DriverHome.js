import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
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
  StatusBar,
  TextInput,
  Platform,
  Vibration,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import apiService from './utils/api';
import LoadingSpinner from './components/ui/LoadingSpinner';
import performanceOptimizer from './utils/performanceOptimizer';
import EnhancedRideRequestModal from './components/EnhancedRideRequestModal';
import LocationTracker from './components/LocationTracker';
import RideStatusScreen from './screens/RideStatusScreen';
import { Colors } from './constants/Colors';
import { Typography } from './constants/Typography';
import { Spacing, BorderRadius, Shadows } from './constants/Spacing';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import { FontWeight } from './constants/Typography';
import OfflineIndicator from './components/OfflineIndicator';

const { width, height } = Dimensions.get("window");

// Add context for availability
const AvailabilityContext = createContext({
  isAvailable: false,
  setIsAvailable: () => {},
  goOnline: () => {},
});

export function useAvailability() {
  return useContext(AvailabilityContext);
}

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
  const [currentRideRequest, setCurrentRideRequest] = useState(null);
  const [driverStats, setDriverStats] = useState({
    totalRides: 0,
    rating: 0,
    onlineHours: 0,
    acceptanceRate: 0
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const mapRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Performance optimization: Memoize expensive calculations
  const totalEarnings = performanceOptimizer.memoize('totalEarnings', () => {
    return earnings.today + earnings.week + earnings.month;
  }, [earnings]);

  // Initialize component with better error handling
  useEffect(() => {
    console.log('🚀 DriverHome: Starting initialization...');
    initializeApp();
    startAnimations();
  }, []);

  // Start entrance animations
  const startAnimations = () => {
    console.log('🎬 DriverHome: Starting animations...');
    try {
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
    } catch (error) {
      console.error('❌ DriverHome: Animation error:', error);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    console.log('🔌 DriverHome: Setting up real-time listeners...');
    const setupRealTimeListeners = () => {
      try {
        // Listen for new ride requests
        apiService.socket?.on('ride:request', (newRideRequest) => {
          console.log('🚗 New ride request received:', newRideRequest);
          setRideRequests(prev => [newRideRequest, ...prev]);
          setCurrentRideRequest(newRideRequest);
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
      } catch (error) {
        console.error('❌ DriverHome: Real-time listener error:', error);
      }
    };

    setupRealTimeListeners();
  }, [currentRide]);

  const initializeApp = async () => {
    console.log('🔧 DriverHome: Initializing app...');
    try {
      setLoading(true);
      setError(null);

      // Initialize API service
      console.log('🔧 DriverHome: Initializing API service...');
      await apiService.init();

      // Get user profile - handle both real and mock users
      try {
        // Check if we have a global user (from login)
        if (global.user) {
          console.log('✅ Using global user from login:', global.user);
          setUser(global.user);
        } else {
          // Try to get from API (for real users)
          console.log('🔧 DriverHome: Fetching user profile from API...');
          const userProfile = await apiService.getDriverProfile();
          setUser(userProfile);
        }
      } catch (error) {
        console.error('❌ DriverHome: Failed to load user profile:', error);
        // Use fallback user data for mock users or when API fails
        const fallbackUser = {
          id: global.user?.id || 'mock-driver',
          name: global.user?.name || 'Demo Driver',
          phone: global.user?.phone || '+1234567890',
          car: global.user?.car_info || global.user?.car || 'Demo Car',
          email: global.user?.email || 'demo@driver.com',
          rating: 4.8,
          totalRides: 1250,
          totalEarnings: 15420.50
        };
        console.log('✅ Using fallback user data:', fallbackUser);
        setUser(fallbackUser);
      }

      // Request location permissions
      console.log('🔧 DriverHome: Requesting location permissions...');
      await requestLocationPermission();

      // Load initial data (with better error handling)
      console.log('🔧 DriverHome: Loading initial data...');
      try {
        await Promise.all([
          loadEarnings(),
          loadCurrentRide(),
          loadRideRequests(),
          loadDriverStats()
        ]);
      } catch (dataError) {
        console.error('❌ DriverHome: Error loading initial data:', dataError);
        // Don't fail the entire app for data loading errors
      }

      // Automatically go online after login and location permission (only for real users)
      if (!isAvailable && global.user?.id && global.user.id !== 'mock-driver') {
        try {
          console.log('🔧 DriverHome: Going online automatically...');
          await goOnline();
        } catch (onlineError) {
          console.error('❌ DriverHome: Error going online:', onlineError);
          // Don't fail the app for online status errors
        }
      }

    } catch (error) {
      console.error('❌ DriverHome: App initialization error:', error);
      setError('Failed to initialize app. Please try again.');
    } finally {
      setLoading(false);
      console.log('✅ DriverHome: Initialization complete');
    }
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  const handleLogout = () => {
    global.user = null;
    navigation.replace('Login');
  };

  // Request location permission
  const requestLocationPermission = async () => {
    console.log('🔧 DriverHome: Requesting location permission...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        console.warn('⚠️ DriverHome: Location permission denied');
        setError('Location permission is required for this app to function properly.');
      }
    } catch (error) {
      console.error('❌ DriverHome: Location permission error:', error);
      setError('Failed to get location permission.');
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    console.log('🔧 DriverHome: Getting current location...');
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(newLocation);
      console.log('✅ DriverHome: Location obtained:', newLocation);
      
      // Update location on server (only for real users)
      if (user && user.id && !user.id.startsWith('mock-driver')) {
        try {
          await apiService.updateDriverLocation(newLocation.latitude, newLocation.longitude);
        } catch (locationError) {
          console.error('❌ DriverHome: Error updating location on server:', locationError);
          // Don't fail for location update errors
        }
      }
    } catch (error) {
      console.error('❌ DriverHome: Location error:', error);
      // Don't set error for location issues as they're not critical
    }
  };

  // Load earnings data
  const loadEarnings = async () => {
    console.log('🔧 DriverHome: Loading earnings data...');
    try {
      const earningsData = await apiService.getEarningsData('week');
      console.log('✅ DriverHome: Earnings data:', earningsData);
      // Handle both API response format and direct mock data
      if (earningsData && typeof earningsData === 'object') {
        setEarnings(earningsData);
      } else {
        setEarnings({ today: 0, week: 0, month: 0 });
      }
    } catch (error) {
      console.error('❌ DriverHome: Error loading earnings:', error);
      // Use default earnings if API fails
      setEarnings({ today: 0, week: 0, month: 0 });
    }
  };

  // Load current ride
  const loadCurrentRide = async () => {
    console.log('🔧 DriverHome: Loading current ride...');
    try {
      const currentRideData = await apiService.getCurrentRide();
      console.log('✅ DriverHome: Current ride data:', currentRideData);
      // Handle both API response format and direct mock data
      if (currentRideData && typeof currentRideData === 'object') {
        setCurrentRide(currentRideData);
      } else {
        setCurrentRide(null);
      }
    } catch (error) {
      console.error('❌ DriverHome: Error loading current ride:', error);
      setCurrentRide(null);
    }
  };

  // Load ride requests
  const loadRideRequests = async () => {
    console.log('🔧 DriverHome: Loading ride requests...');
    try {
      const requests = await apiService.getAvailableRides();
      console.log('✅ DriverHome: Ride requests data:', requests);
      // Handle both API response format and direct mock data
      if (requests && Array.isArray(requests)) {
        setRideRequests(requests);
      } else {
        setRideRequests([]);
      }
    } catch (error) {
      console.error('❌ DriverHome: Error loading ride requests:', error);
      setRideRequests([]);
    }
  };

  // Load driver stats
  const loadDriverStats = async () => {
    console.log('🔧 DriverHome: Loading driver stats...');
    try {
      const stats = await apiService.getDriverStats();
      console.log('✅ DriverHome: Driver stats:', stats);
      // Handle both API response format and direct mock data
      if (stats && typeof stats === 'object') {
        setDriverStats(stats);
      } else {
        setDriverStats({
          totalRides: 1250,
          rating: 4.8,
          onlineHours: 156.5,
          acceptanceRate: 94
        });
      }
    } catch (error) {
      console.error('❌ DriverHome: Error loading driver stats:', error);
      setDriverStats({
        totalRides: 1250,
        rating: 4.8,
        onlineHours: 156.5,
        acceptanceRate: 94
      });
    }
  };

  // Handler to go online (accepting rides)
  const goOnline = async () => {
    console.log('🔧 DriverHome: Going online...');
    try {
      // Check if user is authenticated
      if (!global.user?.id) {
        Alert.alert(
          'Authentication Required', 
          'Please login properly to go online.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => {
                // Navigate back to login
                navigation.navigate('Login');
              }
            }
          ]
        );
        return;
      }

      // For mock users, just set availability locally
      if (global.user.id === 'mock-driver' || global.user.id.startsWith('mock-driver-')) {
        console.log('✅ Mock user going online locally');
        setIsAvailable(true);
        Alert.alert('Success', 'You are now online and ready to accept rides! (Demo Mode)');
        return;
      }

      // For real users, call the API
      await apiService.toggleAvailability(true, currentLocation);
      setIsAvailable(true);
      Alert.alert('Success', 'You are now online and ready to accept rides!');
    } catch (error) {
      console.error('❌ DriverHome: Error going online:', error);
      if (error.message?.includes('Driver ID not found') || error.message?.includes('Invalid token')) {
        Alert.alert(
          'Authentication Error', 
          'Please login again to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => {
                // Clear data and let the app handle navigation
                apiService.clearToken();
                global.user = null;
                global.token = null;
                Alert.alert('Please Login', 'You have been logged out. Please login again.');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to go online. Please try again.');
      }
    }
  };

  // Toggle availability
  const toggleAvailability = async () => {
    console.log('🔧 DriverHome: Toggling availability...');
    try {
      // Check if user is authenticated
      if (!global.user?.id) {
        Alert.alert(
          'Authentication Required', 
          'Please login properly to change your availability status.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => {
                // Navigate back to login
                navigation.navigate('Login');
              }
            }
          ]
        );
        return;
      }

      const newAvailability = !isAvailable;

      // For mock users, just toggle locally
      if (global.user.id === 'mock-driver' || global.user.id.startsWith('mock-driver-')) {
        console.log('✅ Mock user toggling availability locally:', newAvailability);
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
        return;
      }

      // For real users, call the API
      await apiService.toggleAvailability(newAvailability, currentLocation);
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
      console.error('❌ DriverHome: Error updating availability:', error);
      if (error.message?.includes('Driver ID not found') || error.message?.includes('Invalid token')) {
        Alert.alert(
          'Authentication Error', 
          'Please login again to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => {
                // Navigate back to login
                navigation.navigate('Login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update availability status.');
      }
    }
  };

  // Handle ride acceptance
  const handleRideAccepted = (rideRequest) => {
    console.log('✅ DriverHome: Ride accepted:', rideRequest);
    setCurrentRide(rideRequest);
    setRideRequests(prev => prev.filter(ride => ride.id !== rideRequest.id));
    setCurrentRideRequest(null);
    setShowRideRequests(false);
    
    // Navigate to enhanced navigation screen
    navigation.navigate('EnhancedNavigation', {
      ride: rideRequest,
      onRideComplete: (completedRide) => {
        setCurrentRide(null);
        loadEarnings(); // Refresh earnings
        Alert.alert('Success', 'Ride completed successfully!');
      }
    });
  };

  // Handle ride rejection
  const handleRideRejected = (rideRequest) => {
    console.log('❌ DriverHome: Ride rejected:', rideRequest);
    setRideRequests(prev => prev.filter(ride => ride.id !== rideRequest.id));
    setCurrentRideRequest(null);
    setShowRideRequests(false);
  };

  // Complete ride
  const completeRide = async () => {
    console.log('🔧 DriverHome: Completing ride...');
    try {
      setLoading(true);
      await apiService.completeRide(currentRide.id);
      setCurrentRide(null);
      await loadEarnings(); // Refresh earnings
      Alert.alert('Success', 'Ride completed successfully!');
    } catch (error) {
      console.error('❌ DriverHome: Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to enhanced navigation for current ride
  const navigateToEnhancedNavigation = () => {
    if (currentRide) {
      navigation.navigate('EnhancedNavigation', {
        ride: currentRide,
        onRideComplete: (completedRide) => {
          setCurrentRide(null);
          loadEarnings(); // Refresh earnings
          Alert.alert('Success', 'Ride completed successfully!');
        }
      });
    }
  };

  // Handle location updates
  const handleLocationUpdate = (location) => {
    setCurrentLocation(location);
    // Update location on server (only for real users)
    if (user && user.id && !user.id.startsWith('mock-driver')) {
      try {
        apiService.updateDriverLocation(location.latitude, location.longitude);
      } catch (error) {
        console.error('❌ DriverHome: Error updating location:', error);
        // Don't fail for location update errors
      }
    }
  };

  // Refresh data
  const onRefresh = useCallback(async () => {
    console.log('🔧 DriverHome: Refreshing data...');
    setRefreshing(true);
    try {
      await Promise.all([
        loadEarnings(),
        loadCurrentRide(),
        loadRideRequests(),
        loadDriverStats()
      ]);
    } catch (error) {
      console.error('❌ DriverHome: Refresh error:', error);
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
    <AvailabilityContext.Provider value={{ isAvailable, setIsAvailable, goOnline }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {user?.name || 'Driver'} • {isAvailable ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <OfflineIndicator isAvailable={isAvailable} onGoOnline={goOnline} />
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
            <Card variant="outlined" size="medium" style={[
              styles.availabilityCard,
              !isAvailable && styles.availabilityCardOffline
            ]}>
              <View style={styles.availabilityContent}>
                <View style={styles.availabilityInfo}>
                  <Ionicons 
                    name={isAvailable ? "radio-button-on" : "radio-button-off"} 
                    size={24} 
                    color={isAvailable ? Colors.light.success : Colors.light.error} 
                  />
                  <View style={styles.availabilityText}>
                    <Text style={[
                      styles.availabilityTitle,
                      !isAvailable && styles.availabilityTitleOffline
                    ]}>
                      {isAvailable ? 'You are online' : 'You are offline'}
                    </Text>
                    <Text style={styles.availabilitySubtitle}>
                      {isAvailable ? 'Ready to accept rides' : 'Not accepting rides'}
                    </Text>
                  </View>
                </View>
                {!isAvailable ? (
                  <TouchableOpacity 
                    style={styles.goOnlineButton}
                    onPress={goOnline}
                    disabled={loading}
                  >
                    <Ionicons name="radio-button-on" size={16} color="#fff" />
                    <Text style={styles.goOnlineButtonText}>Go Online</Text>
                  </TouchableOpacity>
                ) : (
                  <Switch
                    value={isAvailable}
                    onValueChange={toggleAvailability}
                    trackColor={{ false: Colors.light.border, true: Colors.light.success + '40' }}
                    thumbColor={isAvailable ? Colors.light.success : Colors.light.textTertiary}
                    disabled={loading}
                  />
                )}
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
                <View style={styles.rideActions}>
                  <Button
                    title="Start Navigation"
                    onPress={navigateToEnhancedNavigation}
                    variant="primary"
                    size="medium"
                    icon="navigate"
                    style={styles.navigationButton}
                  />
                  <Button
                    title="Complete Ride"
                    onPress={completeRide}
                    loading={loading}
                    variant="success"
                    size="medium"
                    icon="checkmark"
                    style={styles.completeButton}
                  />
                </View>
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
                  {currentLocation && typeof currentLocation.latitude === 'number' && typeof currentLocation.longitude === 'number' && (
                    <Marker
                      coordinate={currentLocation}
                      title="Your Location"
                      description="Driver location"
                    >
                      <View style={styles.driverMarker}>
                        <Ionicons name="car" size={24} color={Colors.light.primary} />
                      </View>
                    </Marker>
                  )}

                  {/* Current ride route */}
                  {currentRide && currentRide.pickup && currentRide.destination &&
                    typeof currentRide.pickup.latitude === 'number' &&
                    typeof currentRide.pickup.longitude === 'number' &&
                    typeof currentRide.destination.latitude === 'number' &&
                    typeof currentRide.destination.longitude === 'number' && (
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

        {/* Enhanced Ride Request Modal */}
        <EnhancedRideRequestModal
          visible={showRideRequests && currentRideRequest}
          onAccept={handleRideAccepted}
          onReject={handleRideRejected}
          driverLocation={currentLocation}
          pickupLocation={currentRideRequest?.pickupLocation || null}
          dropoffLocation={currentRideRequest?.dropoffLocation || null}
          rideRequest={currentRideRequest}
          loading={loading}
        />
      </SafeAreaView>
    </AvailabilityContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  vehicleInfo: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  earningsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 16,
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsItem: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  availabilityCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  availabilityCardOffline: {
    backgroundColor: Colors.light.surface + '10',
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
    marginLeft: 12,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  availabilityTitleOffline: {
    color: Colors.light.textSecondary,
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  goOnlineButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.success,
  },
  goOnlineButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  currentRideCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  currentRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  rideInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideInfoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  rideActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationButton: {
    padding: 12,
  },
  completeButton: {
    padding: 12,
  },
  rideRequestsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rideRequestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideRequestsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideRequestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  rideRequestPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  rideRequestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideRequestText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  rideRequestTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  rideRequestFare: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  mapCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  driverMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
