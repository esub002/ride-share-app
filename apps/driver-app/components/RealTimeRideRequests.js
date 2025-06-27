import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../utils/api';

const RealTimeRideRequests = ({ onRideAccepted, onRideRejected }) => {
  const [rideRequests, setRideRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const pulseAnimation = new Animated.Value(1);

  useEffect(() => {
    // Start listening for real-time ride requests
    setupRealTimeListeners();
    
    // Load initial ride requests
    loadRideRequests();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(loadRideRequests, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const setupRealTimeListeners = () => {
    // Listen for new ride requests via socket
    apiService.socket?.on('ride:request', (newRideRequest) => {
      console.log('🚗 New ride request received:', newRideRequest);
      addNewRideRequest(newRideRequest);
      triggerPulseAnimation();
    });

    // Listen for ride request cancellations
    apiService.socket?.on('ride:cancelled', (cancelledRide) => {
      console.log('❌ Ride request cancelled:', cancelledRide);
      removeRideRequest(cancelledRide.id);
    });

    // Listen for network status changes
    const status = apiService.getStatus();
    setIsOnline(status.isOnline);
  };

  const triggerPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnimation, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadRideRequests = async () => {
    try {
      setIsLoading(true);
      const requests = await apiService.getAvailableRides();
      setRideRequests(requests || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load ride requests:', error);
      // Don't show error to user as this is background operation
    } finally {
      setIsLoading(false);
    }
  };

  const addNewRideRequest = (newRequest) => {
    setRideRequests(prev => [newRequest, ...prev]);
    setLastUpdate(new Date());
  };

  const removeRideRequest = (rideId) => {
    setRideRequests(prev => prev.filter(ride => ride.id !== rideId));
  };

  const handleAcceptRide = async (rideRequest) => {
    try {
      Alert.alert(
        'Accept Ride Request',
        `Accept ride from ${rideRequest.pickup} to ${rideRequest.destination} for $${rideRequest.fare}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: async () => {
              try {
                await apiService.acceptRide(rideRequest.id);
                removeRideRequest(rideRequest.id);
                
                if (onRideAccepted) {
                  onRideAccepted(rideRequest);
                }
                
                Alert.alert('Ride Accepted', 'You have successfully accepted the ride request!');
              } catch (error) {
                console.error('Failed to accept ride:', error);
                Alert.alert('Error', 'Failed to accept ride. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert('Error', 'Failed to accept ride. Please try again.');
    }
  };

  const handleRejectRide = async (rideRequest) => {
    try {
      Alert.alert(
        'Reject Ride Request',
        'Are you sure you want to reject this ride request?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiService.rejectRide(rideRequest.id, 'Driver unavailable');
                removeRideRequest(rideRequest.id);
                
                if (onRideRejected) {
                  onRideRejected(rideRequest);
                }
              } catch (error) {
                console.error('Failed to reject ride:', error);
                Alert.alert('Error', 'Failed to reject ride. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error rejecting ride:', error);
      Alert.alert('Error', 'Failed to reject ride. Please try again.');
    }
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRideRequestCard = (rideRequest, index) => (
    <Animated.View 
      key={rideRequest.id} 
      style={[
        styles.rideCard,
        { transform: [{ scale: index === 0 ? pulseAnimation : 1 }] }
      ]}
    >
      <View style={styles.rideHeader}>
        <View style={styles.rideInfo}>
          <Text style={styles.rideTitle}>Ride Request #{rideRequest.id}</Text>
          <Text style={styles.rideTime}>
            {formatTime(rideRequest.created_at)}
          </Text>
        </View>
        <View style={styles.fareContainer}>
          <Text style={styles.fareAmount}>${rideRequest.fare}</Text>
          <Text style={styles.fareLabel}>Fare</Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#4CAF50" />
          <Text style={styles.locationText} numberOfLines={2}>
            {rideRequest.pickup}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#FF9800" />
          <Text style={styles.locationText} numberOfLines={2}>
            {rideRequest.destination}
          </Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        {rideRequest.distance && (
          <View style={styles.detailItem}>
            <Ionicons name="map" size={14} color="#666" />
            <Text style={styles.detailText}>
              {formatDistance(rideRequest.distance)}
            </Text>
          </View>
        )}
        {rideRequest.estimated_duration && (
          <View style={styles.detailItem}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.detailText}>
              {rideRequest.estimated_duration} min
            </Text>
          </View>
        )}
        {rideRequest.passenger_name && (
          <View style={styles.detailItem}>
            <Ionicons name="person" size={14} color="#666" />
            <Text style={styles.detailText}>
              {rideRequest.passenger_name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRide(rideRequest)}
        >
          <Ionicons name="close" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRide(rideRequest)}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons 
            name="car" 
            size={24} 
            color={rideRequests.length > 0 ? "#4CAF50" : "#666"} 
          />
          <Text style={styles.headerTitle}>Ride Requests</Text>
          {rideRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{rideRequests.length}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.statusIndicator, isOnline && styles.statusOnline]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {lastUpdate && (
        <Text style={styles.lastUpdateText}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Text>
      )}

      <ScrollView style={styles.requestsContainer} showsVerticalScrollIndicator={false}>
        {isLoading && rideRequests.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading ride requests...</Text>
          </View>
        ) : rideRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No ride requests available</Text>
            <Text style={styles.emptySubtext}>
              New requests will appear here automatically
            </Text>
          </View>
        ) : (
          rideRequests.map((rideRequest, index) => 
            getRideRequestCard(rideRequest, index)
          )
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={loadRideRequests}
        disabled={isLoading}
      >
        <Ionicons 
          name="refresh" 
          size={20} 
          color="#2196F3" 
          style={isLoading && styles.rotating}
        />
        <Text style={styles.refreshButtonText}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginRight: 6,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
  requestsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rideInfo: {
    flex: 1,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rideTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  fareContainer: {
    alignItems: 'center',
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fareLabel: {
    fontSize: 12,
    color: '#666',
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  rideDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 8,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
});

export default RealTimeRideRequests; 