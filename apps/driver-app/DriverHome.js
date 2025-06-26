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
import RideRequestModal from './components/RideRequestModal';
import io from 'socket.io-client';
import { API_BASE_URL } from './utils/api';
import RideStatusScreen from './screens/RideStatusScreen';

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
  const [rideRequest, setRideRequest] = useState(null); // { pickup: { latitude, longitude }, riderName }
  const [modalVisible, setModalVisible] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const socketRef = useRef(null);

  // Performance optimization: Memoize expensive calculations
  const totalEarnings = performanceOptimizer.memoize('totalEarnings', () => {
    return earnings.today + earnings.week + earnings.month;
  }, [earnings]);

  // Initialize component
  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Connect to socket
    const socket = io(API_BASE_URL);
    socketRef.current = socket;
    // Listen for ride_request event
    socket.on('ride_request', async (data) => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setDriverLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setRideRequest(data);
        setModalVisible(true);
      } catch (e) {
        setLoading(false);
      }
      setLoading(false);
    });
    return () => socket.disconnect();
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
          estimatedTime: '8 min',
          origin: '123 Main St, Downtown',
        },
        {
          id: 2,
          passenger: 'Mike Chen',
          pickup: '789 Pine St, Midtown',
          destination: '321 Elm St, Downtown',
          fare: 18.75,
          distance: '1.8 km',
          estimatedTime: '6 min',
          origin: '789 Pine St, Midtown',
        }
      ];
      setRideRequests(mockRequests);
    } catch (error) {
      console.error('Error loading ride requests:', error);
    }
  };

  // Toggle availability
  const toggleAvailability = async () => {
    try {
      setLoading(true);
      const newStatus = !isAvailable;
      setIsAvailable(newStatus);
      
      // Update server
      await apiService.updateAvailability(newStatus);
      
      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit('driver:availability', { available: newStatus });
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', 'Failed to update availability status');
    } finally {
      setLoading(false);
    }
  };

  // Accept ride
  const acceptRide = async (rideId) => {
    try {
      setLoading(true);
      
      // Find the ride request
      const ride = rideRequests.find(r => r.id === rideId);
      if (!ride) {
        throw new Error('Ride not found');
      }
      
      // Update current ride
      setCurrentRide({
        id: rideId,
        origin: ride.origin,
        destination: ride.destination,
        fare: ride.fare,
        passenger: ride.passenger,
        pickup: { latitude: 37.78825, longitude: -122.4324, address: ride.pickup },
        destination: { latitude: 37.7849, longitude: -122.4094, address: ride.destination }
      });
      
      // Remove from requests
      setRideRequests(prev => prev.filter(r => r.id !== rideId));
      
      // Update server
      await apiService.acceptRide(rideId);
      
      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit('ride:accepted', { rideId });
      }
      
      setIsAvailable(false);
      Alert.alert('Ride Accepted!', 'Navigate to pickup location');
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert('Error', 'Failed to accept ride');
    } finally {
      setLoading(false);
    }
  };

  // Reject ride
  const rejectRide = async (rideId) => {
    try {
      // Remove from requests
      setRideRequests(prev => prev.filter(r => r.id !== rideId));
      
      // Update server
      await apiService.rejectRide(rideId);
      
      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit('ride:rejected', { rideId });
      }
    } catch (error) {
      console.error('Error rejecting ride:', error);
    }
  };

  // Complete ride
  const completeRide = async () => {
    try {
      setLoading(true);
      
      // Update earnings
      const newEarnings = { ...earnings, today: earnings.today + currentRide.fare };
      setEarnings(newEarnings);
      
      // Clear current ride
      setCurrentRide(null);
      
      // Update server
      await apiService.completeRide(currentRide.id);
      
      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit('ride:completed', { rideId: currentRide.id });
      }
      
      setIsAvailable(true);
      Alert.alert('Ride Completed!', `You earned $${currentRide.fare}`);
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete ride');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    setModalVisible(false);
    // Handle ride acceptance logic here
    Alert.alert('Ride Accepted', 'You have accepted the ride request.');
  };

  const handleReject = () => {
    setModalVisible(false);
    // Handle ride rejection logic here
    Alert.alert('Ride Rejected', 'You have rejected the ride request.');
  };

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadEarnings(),
        loadCurrentRide(),
        loadRideRequests()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading && !currentLocation) {
    return <LoadingSpinner message="Loading driver app..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeApp}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
            
            {/* Compact Inline Status and Earnings */}
            <View style={styles.inlinePanel}>
              <View style={styles.inlineStatus}>
                <Text style={styles.inlineLabel}>Status</Text>
                <View style={styles.inlineToggle}>
                  <Text style={[styles.inlineText, isAvailable && styles.inlineTextActive]}>
                    {isAvailable ? "ON" : "OFF"}
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
                style={styles.inlineEarnings}
                onPress={() => navigation.navigate('EarningsFinance')}
              >
                <Ionicons name="cash-outline" size={16} color="#fff" />
                <Text style={styles.inlineEarningsText}>${earnings?.today || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle" size={40} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Today's Earnings</Text>
          <Text style={styles.earningsAmount}>${earnings?.today || 0}</Text>
          <View style={styles.earningsBreakdown}>
            <Text style={styles.earningsBreakdownText}>
              Week: ${earnings?.week || 0}
            </Text>
            <Text style={styles.earningsBreakdownText}>
              Month: ${earnings?.month || 0}
            </Text>
          </View>
        </View>

        {/* Ride Request Modal */}
        <RideRequestModal
          visible={modalVisible}
          onAccept={handleAccept}
          onReject={handleReject}
          pickupLocation={rideRequest?.pickup}
          destination={rideRequest?.destination}
          estimatedPrice={rideRequest?.estimatedPrice}
          distance={rideRequest?.distance}
          estimatedTime={rideRequest?.estimatedTime}
          riderName={rideRequest?.riderName}
          loading={loading}
        />

        {/* Map Section - always visible, not inside ScrollView */}
        <View style={styles.mapContainer}>
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
        </View>
      </ScrollView>

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
                  {ride.origin} → {ride.destination}
                </Text>
                <Text style={styles.rideRequestFare}>${ride.fare}</Text>
              </View>
              <View style={styles.rideRequestActions}>
                <TouchableOpacity
                  style={[styles.rideRequestButton, styles.rejectButton]}
                  onPress={() => rejectRide(ride.id)}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rideRequestButton, styles.acceptButton]}
                  onPress={() => acceptRide(ride.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  profileButton: {
    padding: 5,
  },
  mapContainer: {
    margin: 16,
    height: 300,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    borderRadius: 16,
  },
  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  pickupMarker: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  destinationMarker: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  requestMarker: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  currentRideCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  rideInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  completeRideButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  completeRideButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  rideRequestsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideRequestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  rideRequestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rideRequestInfo: {
    flex: 1,
  },
  rideRequestPassenger: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rideRequestRoute: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rideRequestFare: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rideRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rideRequestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  earningsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningsBreakdownText: {
    fontSize: 14,
    color: '#666',
  },
  inlinePanel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  inlineLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  inlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineText: {
    fontSize: 14,
    color: '#666',
  },
  inlineTextActive: {
    fontWeight: 'bold',
  },
  inlineEarnings: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineEarningsText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
});
