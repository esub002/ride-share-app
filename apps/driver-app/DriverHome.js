import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "./utils/api";
import socket from './utils/socket';

const { width, height } = Dimensions.get("window");

export default function DriverHome({ token, user, onRideAccepted, navigation }) {
  const [available, setAvailable] = useState(false);
  const [location, setLocation] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, total: 0 });
  const [showEarnings, setShowEarnings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const mapRef = useRef(null);

  // Location tracking
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location permission is required");
          setMapLoading(false);
          return;
        }

        // Get initial location
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(location.coords);
        setMapLoading(false);

        // Start location updates
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            setLocation(location.coords);
            updateDriverLocation(location.coords);
            // Emit location update via socket
            if (user && user.id) {
              socket.emit('driver:location', {
                driverId: user.id,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          }
        );
      } catch (error) {
        console.error("Error getting location:", error);
        setMapLoading(false);
        Alert.alert("Location Error", "Unable to get your location");
      }
    })();
  }, []);

  // Update driver location on backend
  const updateDriverLocation = async (coords) => {
    if (!token || !user) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/drivers/${user.id}/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  // Toggle availability
  const toggleAvailability = async (value) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ available: value }),
      });

      if (response.ok) {
        setAvailable(value);
        if (value) {
          fetchRideRequests();
        }
      } else {
        Alert.alert("Error", "Failed to update availability");
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  // Fetch available ride requests
  const fetchRideRequests = async () => {
    if (!available) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rides?status=requested`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const rides = await response.json();
        setRideRequests(rides);
      }
    } catch (error) {
      console.error("Error fetching ride requests:", error);
    }
  };

  // Accept ride request
  const acceptRide = async (rideId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rides/${rideId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (response.ok) {
        const ride = await response.json();
        setCurrentRide(ride);
        setRideRequests([]);
        setAvailable(false);
        Alert.alert("Ride Accepted", "Navigate to pickup location");
        onRideAccepted(ride);
      } else {
        Alert.alert("Error", "Failed to accept ride");
      }
    } catch (error) {
      console.error("Error accepting ride:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  // Complete ride
  const completeRide = async () => {
    if (!currentRide) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rides/${currentRide.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (response.ok) {
        const ride = await response.json();
        setCurrentRide(null);
        setAvailable(true);
        fetchEarnings();
        Alert.alert("Ride Completed", "Great job! You're now available for new rides.");
      } else {
        Alert.alert("Error", "Failed to complete ride");
      }
    } catch (error) {
      console.error("Error completing ride:", error);
      Alert.alert("Error", "Network error");
    }
    setLoading(false);
  };

  // Fetch earnings
  const fetchEarnings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/earnings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const earningsData = await response.json();
        setEarnings(earningsData);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  // Fetch earnings on mount
  useEffect(() => {
    if (token && user) {
      fetchEarnings();
    }
  }, [token, user]);

  // Fetch ride requests when available
  useEffect(() => {
    if (available) {
      fetchRideRequests();
      const interval = setInterval(fetchRideRequests, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [available]);

  return (
    <View style={styles.container}>
      {/* Map */}
      {mapLoading ? (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={
            location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
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
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
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
              {location && (
                <Polyline
                  coordinates={[
                    { latitude: location.latitude, longitude: location.longitude },
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
          {available && rideRequests.map((ride) => (
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
            <Text style={[styles.statusText, available && styles.statusTextActive]}>
              {available ? "Available" : "Unavailable"}
            </Text>
            <Switch
              value={available}
              onValueChange={toggleAvailability}
              disabled={loading || currentRide}
              trackColor={{ false: "#ddd", true: "#4CAF50" }}
              thumbColor={available ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.earningsButton}
          onPress={() => setShowEarnings(true)}
        >
          <Ionicons name="cash-outline" size={20} color="#fff" />
          <Text style={styles.earningsText}>${earnings.today}</Text>
        </TouchableOpacity>
      </View>

      {/* Current Ride Info */}
      {currentRide && (
        <View style={styles.currentRideCard}>
          <Text style={styles.currentRideTitle}>Current Ride</Text>
          <Text style={styles.rideInfo}>From: {currentRide.origin}</Text>
          <Text style={styles.rideInfo}>To: {currentRide.destination}</Text>
          <Text style={styles.rideStatus}>Status: {currentRide.status}</Text>
          
          <TouchableOpacity
            style={styles.completeButton}
            onPress={completeRide}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>Complete Ride</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Ride Requests */}
      {available && rideRequests.length > 0 && (
        <View style={styles.rideRequestsCard}>
          <Text style={styles.rideRequestsTitle}>New Ride Requests</Text>
          <ScrollView style={styles.rideRequestsList}>
            {rideRequests.map((ride) => (
              <View key={ride.id} style={styles.rideRequestItem}>
                <View style={styles.rideRequestInfo}>
                  <Text style={styles.rideRequestFrom}>From: {ride.origin}</Text>
                  <Text style={styles.rideRequestTo}>To: {ride.destination}</Text>
                </View>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => acceptRide(ride.id)}
                  disabled={loading}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Earnings Modal */}
      <Modal
        visible={showEarnings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEarnings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Earnings</Text>
              <TouchableOpacity onPress={() => setShowEarnings(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Today's Earnings</Text>
              <Text style={styles.earningsAmount}>${earnings.today}</Text>
            </View>
            
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsAmount}>${earnings.total}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  rideStatus: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 15,
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  completeButtonText: {
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
  rideRequestsList: {
    maxHeight: 150,
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
  rideRequestFrom: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  rideRequestTo: {
    fontSize: 14,
    color: "#666",
  },
  acceptButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
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
});
