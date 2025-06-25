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
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import apiService from './utils/api';
import socket from './utils/socket';
import LoadingSpinner from './components/LoadingSpinner';
import performanceOptimizer from './utils/performanceOptimizer';

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
  const mapRef = useRef(null);

  // Performance optimization: Memoize expensive calculations
  const totalEarnings = performanceOptimizer.memoize('totalEarnings', () => {
    return earnings.today + earnings.week + earnings.month;
  }, [earnings]);

  // Initialize component
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize API service
      await apiService.init();

      // Set mock user data
      const mockUser = {
        id: 1,
        name: 'John Driver',
        phone: '+1234567890',
        car: 'Toyota Prius 2020',
        email: 'john.driver@example.com'
      };
      setUser(mockUser);

      // Request location permissions
      await requestLocationPermission();

      // Load initial data
      await Promise.all([
        loadEarnings(),
        loadCurrentRide(),
        loadRideRequests()
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
        await apiService.updateLocation(newLocation.latitude, newLocation.longitude);
      }
    } catch (error) {
      console.error('Location error:', error);
      // Don't set error for location issues as they're not critical
    }
  };

  // Load earnings data
  const loadEarnings = async () => {
    try {
      const response = await apiService.getEarningsData('week');
      if (response.success) {
        setEarnings(response.data);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      // Use default earnings if API fails
      setEarnings({ today: 85.50, week: 420.75, month: 1850.25 });
    }
  };

  // Load current ride
  const loadCurrentRide = async () => {
    try {
      const response = await apiService.getCurrentRide();
      if (response.success && response.data) {
        setCurrentRide(response.data);
      }
    } catch (error) {
      console.error('Error loading current ride:', error);
    }
  };

  // Load ride requests
  const loadRideRequests = async () => {
    try {
      // This would be replaced with actual API call
      const mockRequests = [
        {
          id: 1,
          passenger: 'Sarah Johnson',
          pickup: '123 Main St, Downtown',
          destination: '456 Oak Ave, Uptown',
          fare: 25.50,
          distance: '2.5 km',
          estimatedTime: '8 min'
        }
      ];
      setRideRequests(mockRequests);
    } catch (error) {
      console.error('Error loading ride requests:', error);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadEarnings(),
        loadCurrentRide(),
        loadRideRequests(),
        getCurrentLocation()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Toggle availability
  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      setIsAvailable(newStatus);
      
      // In a real app, this would update the server
      console.log(`Driver ${newStatus ? 'online' : 'offline'}`);
      
      if (newStatus) {
        Alert.alert('Online', 'You are now available for rides!');
      } else {
        Alert.alert('Offline', 'You are now offline and unavailable for rides.');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      // Revert state on error
      setIsAvailable(!isAvailable);
      Alert.alert('Error', 'Failed to update availability status.');
    }
  };

  // Accept ride request
  const acceptRide = async (rideId) => {
    try {
      const response = await apiService.acceptRide(rideId);
      if (response.success) {
        Alert.alert('Ride Accepted', 'You have accepted the ride request!');
        // Remove from requests and set as current ride
        setRideRequests(prev => prev.filter(ride => ride.id !== rideId));
        setCurrentRide(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to accept ride');
      }
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert('Error', 'Failed to accept ride request.');
    }
  };

  // Reject ride request
  const rejectRide = async (rideId) => {
    try {
      const response = await apiService.rejectRide(rideId);
      if (response.success) {
        Alert.alert('Ride Rejected', 'Ride request has been rejected.');
        setRideRequests(prev => prev.filter(ride => ride.id !== rideId));
      } else {
        Alert.alert('Error', response.error || 'Failed to reject ride');
      }
    } catch (error) {
      console.error('Error rejecting ride:', error);
      Alert.alert('Error', 'Failed to reject ride request.');
    }
  };

  // Complete current ride
  const completeRide = async () => {
    if (!currentRide) return;
    
    try {
      const response = await apiService.completeRide(currentRide.id);
      if (response.success) {
        Alert.alert('Ride Completed', 'Ride has been completed successfully!');
        setCurrentRide(null);
        // Refresh earnings
        await loadEarnings();
      } else {
        Alert.alert('Error', response.error || 'Failed to complete ride');
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete ride.');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner 
          type="pulse" 
          text="Loading Driver Dashboard..." 
          color="#2196F3"
        />
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={initializeApp}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {/* Map */}
        {currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={
              currentLocation
                ? {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
                : {
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
            }
            showsUserLocation
            showsMyLocationButton
            loadingEnabled={true}
            loadingIndicatorColor="#2196F3"
            loadingBackgroundColor="#ffffff"
          >
            {/* Driver Location Marker */}
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Your Location"
                description="You are here"
                pinColor="#2196F3"
              >
                <View style={styles.driverMarker}>
                  <Ionicons name="car" size={24} color="#2196F3" />
                </View>
              </Marker>
            )}

            {/* Current Ride Markers and Route */}
            {currentRide && currentRide.pickup && currentRide.destination && (
              <>
                {/* Pickup Marker */}
                <Marker
                  coordinate={{
                    latitude: currentRide.pickup.latitude,
                    longitude: currentRide.pickup.longitude,
                  }}
                  title="Pickup Location"
                  description={currentRide.pickup.address}
                  pinColor="#FF9800"
                >
                  <View style={styles.pickupMarker}>
                    <Ionicons name="location" size={20} color="#FF9800" />
                  </View>
                </Marker>

                {/* Destination Marker */}
                <Marker
                  coordinate={{
                    latitude: currentRide.destination.latitude,
                    longitude: currentRide.destination.longitude,
                  }}
                  title="Destination"
                  description={currentRide.destination.address}
                  pinColor="#4CAF50"
                >
                  <View style={styles.destinationMarker}>
                    <Ionicons name="flag" size={20} color="#4CAF50" />
                  </View>
                </Marker>

                {/* Route Polyline */}
                {currentLocation && (
                  <Polyline
                    coordinates={[
                      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                      { latitude: currentRide.pickup.latitude, longitude: currentRide.pickup.longitude },
                      { latitude: currentRide.destination.latitude, longitude: currentRide.destination.longitude },
                    ]}
                    strokeColor="#2196F3"
                    strokeWidth={3}
                    lineDashPattern={[5, 5]}
                  />
                )}
              </>
            )}

            {/* Ride Request Markers */}
            {isAvailable && rideRequests.map((ride) => (
              <Marker
                key={ride.id}
                coordinate={{
                  latitude: ride.pickup?.latitude || 37.78825,
                  longitude: ride.pickup?.longitude || -122.4324,
                }}
                title="Ride Request"
                description={`${ride.origin} → ${ride.destination}`}
                pinColor="#FF5722"
                onPress={() => {
                  // Show ride request details
                  Alert.alert(
                    "Ride Request",
                    `From: ${ride.origin}\nTo: ${ride.destination}\nFare: $${ride.fare || 'TBD'}`,
                    [
                      { text: "Reject", style: "cancel" },
                      { text: "Accept", onPress: () => acceptRide(ride.id) }
                    ]
                  );
                }}
              >
                <View style={styles.requestMarker}>
                  <Ionicons name="car-outline" size={20} color="#FF5722" />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.mapLoadingText}>Loading map...</Text>
          </View>
        )}

        {/* Hamburger Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>

        {/* Top Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={styles.statusToggle}>
              <Text style={[styles.statusText, isAvailable && styles.statusTextActive]}>
                {isAvailable ? "Available" : "Unavailable"}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailability}
                disabled={loading || currentRide}
                trackColor={{ false: "#ddd", true: "#4CAF50" }}
                thumbColor={isAvailable ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.earningsButton}
            onPress={() => navigation.navigate('EarningsFinance')}
          >
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <Text style={styles.earningsText}>${earnings?.today || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Current Ride Info */}
        {currentRide && (
          <View style={styles.currentRideCard}>
            <Text style={styles.currentRideTitle}>Current Ride</Text>
            <Text style={styles.rideInfo}>From: {currentRide.origin}</Text>
            <Text style={styles.rideInfo}>To: {currentRide.destination}</Text>
            <Text style={styles.rideInfo}>Fare: ${currentRide.fare}</Text>
            <TouchableOpacity
              style={styles.completeRideButton}
              onPress={completeRide}
            >
              <Text style={styles.completeRideButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ride Requests */}
        {isAvailable && rideRequests.length > 0 && (
          <View style={styles.rideRequestsCard}>
            <Text style={styles.rideRequestsTitle}>New Ride Requests</Text>
            {rideRequests.map((ride) => (
              <View key={ride.id} style={styles.rideRequestItem}>
                <View style={styles.rideRequestInfo}>
                  <Text style={styles.rideRequestPassenger}>{ride.passenger}</Text>
                  <Text style={styles.rideRequestRoute}>
                    {ride.pickup} → {ride.destination}
                  </Text>
                  <Text style={styles.rideRequestDetails}>
                    ${ride.fare} • {ride.distance} • {ride.estimatedTime}
                  </Text>
                </View>
                <View style={styles.rideRequestActions}>
                  <TouchableOpacity
                    style={[styles.rideRequestButton, styles.rejectButton]}
                    onPress={() => rejectRide(ride.id)}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rideRequestButton, styles.acceptButton]}
                    onPress={() => acceptRide(ride.id)}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Ionicons name="wallet" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('TripHistory')}
            >
              <Ionicons name="time" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('SafetyFeatures')}
            >
              <Ionicons name="shield" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>Safety</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statusBar: {
    position: "absolute",
    top: 50,
    left: 80,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  statusTextActive: {
    color: "#4CAF50",
  },
  earningsButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  earningsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  currentRideCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentRideTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  rideInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  completeRideButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  completeRideButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  rideRequestsCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rideRequestsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rideRequestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rideRequestInfo: {
    flex: 1,
  },
  rideRequestPassenger: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  rideRequestRoute: {
    fontSize: 14,
    color: "#666",
  },
  rideRequestDetails: {
    fontSize: 14,
    color: "#666",
  },
  rideRequestActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  rideRequestButton: {
    padding: 8,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: "#F44336",
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: width * 0.8,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  earningsCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  earningsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  menuButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#fff",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapLoadingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  requestMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  errorMessage: {
    color: "#666",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  quickActionsCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickActionButton: {
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
});
