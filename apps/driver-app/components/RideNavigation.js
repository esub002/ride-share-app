import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function RideNavigation({ ride, onComplete, onCancel }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [navigationMode, setNavigationMode] = useState("pickup"); // "pickup" or "dropoff"
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  const pickupLocation = {
    latitude: 37.78825, // This would come from ride data
    longitude: -122.4324,
  };

  const dropoffLocation = {
    latitude: 37.7849, // This would come from ride data
    longitude: -122.4094,
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      calculateRoute();
    }
  }, [currentLocation, navigationMode]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required for navigation");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location.coords);

      // Start location updates for navigation
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds during navigation
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          setCurrentLocation(location.coords);
          updateNavigationProgress(location.coords);
        }
      );
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location");
    }
  };

  const calculateRoute = async () => {
    if (!currentLocation) return;

    setLoading(true);
    try {
      const destination = navigationMode === "pickup" ? pickupLocation : dropoffLocation;
      
      // Calculate distance and estimated time
      const distanceInMeters = calculateDistance(currentLocation, destination);
      const estimatedTime = Math.ceil(distanceInMeters / 1000 / 30); // Assuming 30 km/h average speed
      
      setDistance(distanceInMeters);
      setDuration(estimatedTime);

      // Generate route coordinates (simplified - in real app, use Google Directions API)
      const route = generateRouteCoordinates(currentLocation, destination);
      setRouteCoordinates(route);

      // Animate map to show route
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(route, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    }
    setLoading(false);
  };

  const calculateDistance = (origin, destination) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (origin.latitude * Math.PI) / 180;
    const φ2 = (destination.latitude * Math.PI) / 180;
    const Δφ = ((destination.latitude - origin.latitude) * Math.PI) / 180;
    const Δλ = ((destination.longitude - origin.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const generateRouteCoordinates = (origin, destination) => {
    // Simplified route generation - in real app, use Google Directions API
    const steps = 10;
    const coordinates = [];
    
    for (let i = 0; i <= steps; i++) {
      const lat = origin.latitude + (destination.latitude - origin.latitude) * (i / steps);
      const lng = origin.longitude + (destination.longitude - origin.longitude) * (i / steps);
      coordinates.push({ latitude: lat, longitude: lng });
    }
    
    return coordinates;
  };

  const updateNavigationProgress = (location) => {
    const destination = navigationMode === "pickup" ? pickupLocation : dropoffLocation;
    const distanceToDestination = calculateDistance(location, destination);
    
    // If within 50 meters of destination, show arrival notification
    if (distanceToDestination < 50) {
      if (navigationMode === "pickup") {
        Alert.alert(
          "Arrived at Pickup",
          "You have arrived at the pickup location. Please wait for the rider.",
          [
            {
              text: "Start Trip",
              onPress: () => setNavigationMode("dropoff"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Arrived at Destination",
          "You have arrived at the destination. Please complete the ride.",
          [
            {
              text: "Complete Ride",
              onPress: onComplete,
            },
          ]
        );
      }
    }
  };

  const switchToDropoff = () => {
    setNavigationMode("dropoff");
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <View style={styles.container}>
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
        followsUserLocation
      >
        {/* Current location marker */}
        {currentLocation && typeof currentLocation.latitude === 'number' && typeof currentLocation.longitude === 'number' && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="You are here"
            pinColor="#2196F3"
          />
        )}

        {/* Pickup location marker */}
        {pickupLocation && typeof pickupLocation.latitude === 'number' && typeof pickupLocation.longitude === 'number' && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup Location"
            description="Pick up the rider here"
            pinColor="#4CAF50"
          />
        )}

        {/* Dropoff location marker */}
        {dropoffLocation && typeof dropoffLocation.latitude === 'number' && typeof dropoffLocation.longitude === 'number' && (
          <Marker
            coordinate={dropoffLocation}
            title="Dropoff Location"
            description="Drop off the rider here"
            pinColor="#FF5722"
          />
        )}

        {/* Route line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#2196F3"
          />
        )}
      </MapView>

      {/* Navigation Header */}
      <View style={styles.navigationHeader}>
        <View style={styles.navigationInfo}>
          <Text style={styles.navigationTitle}>
            {navigationMode === "pickup" ? "Navigate to Pickup" : "Navigate to Dropoff"}
          </Text>
          <Text style={styles.navigationSubtitle}>
            {navigationMode === "pickup" ? ride?.origin : ride?.destination}
          </Text>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Navigation Details */}
      <View style={styles.navigationDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={20} color="#666" />
          <Text style={styles.detailText}>{formatDistance(distance)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={20} color="#666" />
          <Text style={styles.detailText}>{formatDuration(duration)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="car" size={20} color="#666" />
          <Text style={styles.detailText}>
            {navigationMode === "pickup" ? "Pickup" : "Dropoff"}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {navigationMode === "pickup" && (
          <TouchableOpacity style={styles.actionButton} onPress={switchToDropoff}>
            <Text style={styles.actionButtonText}>Start Trip</Text>
          </TouchableOpacity>
        )}
        {navigationMode === "dropoff" && (
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Text style={styles.completeButtonText}>Complete Ride</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      )}
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
  navigationHeader: {
    position: "absolute",
    top: 50,
    left: 20,
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
  navigationInfo: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  navigationSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  cancelButton: {
    backgroundColor: "#FF5722",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  navigationDetails: {
    position: "absolute",
    top: 140,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailItem: {
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
    fontWeight: "600",
  },
  actionButtons: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  actionButton: {
    backgroundColor: "#2196F3",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
}); 