import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import MapView, { 
  Marker, 
  Polyline, 
  PROVIDER_GOOGLE,
  Circle,
  Callout,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import navigationService from '../utils/navigationService';

const { width, height } = Dimensions.get('window');

const EnhancedMapComponent = ({ 
  ride, 
  onComplete, 
  onCancel, 
  showTraffic = true,
  showAlternatives = true,
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [navigationMode, setNavigationMode] = useState('pickup');
  const [isNavigating, setIsNavigating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [mapType, setMapType] = useState('standard');

  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeMap();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (currentLocation && ride) {
      calculateRoute();
    }
  }, [currentLocation, navigationMode, ride]);

  const initializeMap = async () => {
    try {
      setLoading(true);
      
      await navigationService.init();
      await getCurrentLocation();
      startLocationTracking();
      
      setLoading(false);
    } catch (error) {
      console.error('🗺️ Failed to initialize map:', error);
      Alert.alert('Error', 'Failed to initialize map. Please check location permissions.');
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(location.coords);
    } catch (error) {
      console.error('🗺️ Error getting location:', error);
      throw error;
    }
  };

  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation(location.coords);
          updateNavigationProgress(location.coords);
        }
      );
    } catch (error) {
      console.error('🗺️ Error starting location tracking:', error);
    }
  };

  const calculateRoute = async () => {
    if (!currentLocation || !ride) return;

    try {
      setLoading(true);
      
      const destination = navigationMode === 'pickup' 
        ? { latitude: ride.pickup_lat || 37.78825, longitude: ride.pickup_lng || -122.4324 }
        : { latitude: ride.destination_lat || 37.7849, longitude: ride.destination_lng || -122.4094 };

      const route = await navigationService.calculateRoute(currentLocation, destination);
      setRouteData(route);
      setSelectedRoute(route);

      if (showAlternatives) {
        const alternatives = await navigationService.getAlternativeRoutes(currentLocation, destination);
        setAlternativeRoutes(alternatives);
      }

      if (showTraffic) {
        const traffic = await getTrafficData(currentLocation, destination);
        setTrafficData(traffic);
      }

      if (mapRef.current && route.polyline.length > 0) {
        mapRef.current.fitToCoordinates(route.polyline, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('🗺️ Error calculating route:', error);
      setLoading(false);
    }
  };

  const getTrafficData = async (origin, destination) => {
    const trafficLevel = navigationService.getTrafficLevel();
    const distance = navigationService.calculateDistance(origin, destination);
    
    return {
      level: trafficLevel,
      color: getTrafficColor(trafficLevel),
      description: getTrafficDescription(trafficLevel),
      delay: Math.floor(Math.random() * 15) + 5,
      affectedSegments: Math.floor(Math.random() * 5) + 1,
    };
  };

  const getTrafficColor = (level) => {
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#FF5722',
      severe: '#9C27B0',
    };
    return colors[level] || '#FF9800';
  };

  const getTrafficDescription = (level) => {
    const descriptions = {
      low: 'Light traffic',
      medium: 'Moderate traffic',
      high: 'Heavy traffic',
      severe: 'Severe congestion',
    };
    return descriptions[level] || 'Moderate traffic';
  };

  const updateNavigationProgress = (location) => {
    if (!isNavigating || !routeData) return;

    const destination = navigationMode === 'pickup' 
      ? { latitude: ride.pickup_lat || 37.78825, longitude: ride.pickup_lng || -122.4324 }
      : { latitude: ride.destination_lat || 37.7849, longitude: ride.destination_lng || -122.4094 };

    const distanceToDestination = navigationService.calculateDistance(location, destination);
    
    if (distanceToDestination < 50) {
      handleArrival();
    }
  };

  const handleArrival = () => {
    setIsNavigating(false);
    navigationService.stopNavigation();
    
    const message = navigationMode === 'pickup' 
      ? 'You have arrived at the pickup location!'
      : 'You have arrived at the destination!';
    
    Alert.alert('Arrived!', message, [
      {
        text: 'OK',
        onPress: () => {
          if (navigationMode === 'pickup') {
            setNavigationMode('dropoff');
            setIsNavigating(true);
            navigationService.startNavigation(
              { latitude: ride.destination_lat || 37.7849, longitude: ride.destination_lng || -122.4094 },
              'dropoff'
            );
          } else {
            onComplete && onComplete();
          }
        }
      }
    ]);
  };

  const startNavigation = async () => {
    try {
      setIsNavigating(true);
      
      const destination = navigationMode === 'pickup' 
        ? { latitude: ride.pickup_lat || 37.78825, longitude: ride.pickup_lng || -122.4324 }
        : { latitude: ride.destination_lat || 37.7849, longitude: ride.destination_lng || -122.4094 };

      await navigationService.startNavigation(destination, navigationMode);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      console.log('🧭 Navigation started');
    } catch (error) {
      console.error('🧭 Failed to start navigation:', error);
      setIsNavigating(false);
    }
  };

  const openExternalNavigation = async () => {
    try {
      const destination = navigationMode === 'pickup' 
        ? { latitude: ride.pickup_lat || 37.78825, longitude: ride.pickup_lng || -122.4324 }
        : { latitude: ride.destination_lat || 37.7849, longitude: ride.destination_lng || -122.4094 };

      await navigationService.openExternalNavigation(destination);
    } catch (error) {
      console.error('🧭 Failed to open external navigation:', error);
    }
  };

  const selectRoute = (route) => {
    setSelectedRoute(route);
    setRouteData(route);
    
    if (mapRef.current && route.polyline.length > 0) {
      mapRef.current.fitToCoordinates(route.polyline, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleMapType = () => {
    const types = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cleanup = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    navigationService.cleanup();
  };

  const getPickupLocation = () => ({
    latitude: ride?.pickup_lat || 37.78825,
    longitude: ride?.pickup_lng || -122.4324,
  });

  const getDropoffLocation = () => ({
    latitude: ride?.destination_lat || 37.7849,
    longitude: ride?.destination_lng || -122.4094,
  });

  const formatDistance = (meters) => {
    return navigationService.formatDistance(meters);
  };

  const formatDuration = (minutes) => {
    return navigationService.formatDuration(minutes);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
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
        followsUserLocation={isNavigating}
        showsTraffic={showTraffic}
        showsBuildings
        showsIndoors
        showsCompass
        showsScale
        showsPointsOfInterest
      >
        {currentLocation && typeof currentLocation.latitude === 'number' && typeof currentLocation.longitude === 'number' && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="You are here"
            pinColor="#2196F3"
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Your Location</Text>
                <Text style={styles.calloutText}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </Callout>
          </Marker>
        )}

        {getPickupLocation() && typeof getPickupLocation().latitude === 'number' && typeof getPickupLocation().longitude === 'number' && (
          <Marker
            coordinate={getPickupLocation()}
            title="Pickup Location"
            description="Pick up the rider here"
            pinColor="#4CAF50"
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Pickup Location</Text>
                <Text style={styles.calloutText}>{ride?.pickup || 'Pickup address'}</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {getDropoffLocation() && typeof getDropoffLocation().latitude === 'number' && typeof getDropoffLocation().longitude === 'number' && (
          <Marker
            coordinate={getDropoffLocation()}
            title="Dropoff Location"
            description="Drop off the rider here"
            pinColor="#FF5722"
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Dropoff Location</Text>
                <Text style={styles.calloutText}>{ride?.destination || 'Destination address'}</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {selectedRoute && selectedRoute.polyline.length > 0 && (
          <Polyline
            coordinates={selectedRoute.polyline}
            strokeWidth={4}
            strokeColor={selectedRoute.fuelEfficient ? '#4CAF50' : '#2196F3'}
            lineDashPattern={selectedRoute.tolls ? [10, 5] : undefined}
          />
        )}

        {showTraffic && trafficData && (
          <Circle
            center={currentLocation || { latitude: 37.78825, longitude: -122.4324 }}
            radius={1000}
            fillColor={`${trafficData.color}20`}
            strokeColor={trafficData.color}
            strokeWidth={2}
          />
        )}
      </MapView>

      <Animated.View 
        style={[
          styles.navigationHeader,
          { opacity: fadeAnimation, transform: [{ translateY: slideAnimation }] }
        ]}
      >
        <View style={styles.navigationInfo}>
          <Text style={styles.navigationTitle}>
            {navigationMode === 'pickup' ? 'Navigate to Pickup' : 'Navigate to Dropoff'}
          </Text>
          <Text style={styles.navigationSubtitle}>
            {navigationMode === 'pickup' ? ride?.pickup : ride?.destination}
          </Text>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {selectedRoute && (
        <View style={styles.routeDetails}>
          <View style={styles.routeInfo}>
            <View style={styles.routeItem}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.routeText}>
                {formatDistance(selectedRoute.distance)}
              </Text>
            </View>
            <View style={styles.routeItem}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.routeText}>
                {formatDuration(selectedRoute.durationInTraffic)}
              </Text>
            </View>
            {selectedRoute.tolls && (
              <View style={styles.routeItem}>
                <Ionicons name="card" size={20} color="#FF9800" />
                <Text style={styles.routeText}>Tolls</Text>
              </View>
            )}
            {selectedRoute.fuelEfficient && (
              <View style={styles.routeItem}>
                <Ionicons name="leaf" size={20} color="#4CAF50" />
                <Text style={styles.routeText}>Eco</Text>
              </View>
            )}
          </View>

          {trafficData && (
            <View style={[styles.trafficIndicator, { backgroundColor: trafficData.color }]}>
              <Ionicons name="car" size={16} color="#fff" />
              <Text style={styles.trafficText}>{trafficData.description}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actionButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.mapTypeButton} 
            onPress={toggleMapType}
          >
            <Ionicons name="layers" size={20} color="#666" />
            <Text style={styles.mapTypeText}>{mapType}</Text>
          </TouchableOpacity>

          {showAlternatives && alternativeRoutes.length > 0 && (
            <TouchableOpacity 
              style={styles.alternativesButton} 
              onPress={() => setShowRouteDetails(true)}
            >
              <Ionicons name="options" size={20} color="#666" />
              <Text style={styles.alternativesText}>Routes</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.externalButton} 
            onPress={openExternalNavigation}
          >
            <Ionicons name="open-outline" size={20} color="#fff" />
            <Text style={styles.externalButtonText}>External Nav</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.navigationButton, 
              isNavigating && styles.navigationButtonActive
            ]} 
            onPress={startNavigation}
            disabled={isNavigating}
          >
            <Ionicons 
              name={isNavigating ? "pause" : "play"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.navigationButtonText}>
              {isNavigating ? 'Stop' : 'Start'} Navigation
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      )}

      <Modal
        visible={showRouteDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRouteDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Route Options</Text>
              <TouchableOpacity onPress={() => setShowRouteDetails(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.routesList}>
              {alternativeRoutes.map((route, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.routeOption,
                    selectedRoute === route && styles.routeOptionSelected
                  ]}
                  onPress={() => {
                    selectRoute(route);
                    setShowRouteDetails(false);
                  }}
                >
                  <View style={styles.routeOptionHeader}>
                    <Text style={styles.routeOptionName}>{route.name}</Text>
                    <Text style={styles.routeOptionDescription}>{route.description}</Text>
                  </View>
                  <View style={styles.routeOptionDetails}>
                    <Text style={styles.routeOptionDistance}>
                      {formatDistance(route.distance)}
                    </Text>
                    <Text style={styles.routeOptionDuration}>
                      {formatDuration(route.durationInTraffic)}
                    </Text>
                  </View>
                  {route.tolls && (
                    <View style={styles.routeOptionBadge}>
                      <Text style={styles.routeOptionBadgeText}>Tolls</Text>
                    </View>
                  )}
                  {route.fuelEfficient && (
                    <View style={[styles.routeOptionBadge, { backgroundColor: '#4CAF50' }]}>
                      <Text style={styles.routeOptionBadgeText}>Eco</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  navigationHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  navigationSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#FF5722',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeDetails: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  routeItem: {
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    fontWeight: '600',
  },
  trafficIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  trafficText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mapTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  mapTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  alternativesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  alternativesText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
  },
  externalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 12,
    flex: 2,
  },
  navigationButtonActive: {
    backgroundColor: '#FF5722',
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  calloutContainer: {
    padding: 8,
    minWidth: 120,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  calloutText: {
    fontSize: 12,
    color: '#666',
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
    maxHeight: height * 0.7,
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
  routesList: {
    padding: 20,
  },
  routeOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  routeOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  routeOptionHeader: {
    marginBottom: 8,
  },
  routeOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  routeOptionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  routeOptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeOptionDistance: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  routeOptionDuration: {
    fontSize: 14,
    color: '#666',
  },
  routeOptionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeOptionBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EnhancedMapComponent; 