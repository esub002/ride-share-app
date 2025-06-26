import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import socket from '../utils/socket';

export default function RideManagement() {
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStatus, setRideStatus] = useState('idle');
  const [showRideModal, setShowRideModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Socket connection management
    const handleConnect = () => {
      setSocketConnected(true);
      console.log('Socket connected');
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
      console.log('Socket disconnected');
    };

    const handleRideRequest = (ride) => {
      setCurrentRide(ride);
      setShowRideModal(true);
    };

    // Set up socket event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('ride:request', handleRideRequest);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('ride:request', handleRideRequest);
    };
  }, []);

  const acceptRide = async () => {
    setLoading(true);
    try {
      // Emit accept event to backend
      if (currentRide && currentRide.id) {
        socket.emit('ride:accept', { rideId: currentRide.id });
      }
      setRideStatus('pickup');
      setShowRideModal(false);
      Alert.alert('Ride Accepted!', 'Navigate to pickup location');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept ride');
    }
    setLoading(false);
  };

  const rejectRide = () => {
    // Emit reject event to backend
    if (currentRide && currentRide.id) {
      socket.emit('ride:reject', { rideId: currentRide.id });
    }
    setShowRideModal(false);
    setCurrentRide(null);
  };

  const openNavigation = (destination) => {
    const { latitude, longitude } = destination;
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const latLng = `${latitude},${longitude}`;
    const label = destination.address;
    const url = Platform.select({
      ios: `${scheme}${latLng}?q=${label}`,
      android: `${scheme}0,0?q=${latLng}(${label})`,
    });

    Linking.openURL(url);
  };

  const startRide = () => {
    setRideStatus('in-progress');
    Alert.alert('Ride Started', 'Navigate to destination');
  };

  const completeRide = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRideStatus('completed');
      setCurrentRide(null);
      Alert.alert('Ride Completed!', `You earned $${currentRide.fare}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete ride');
    }
    setLoading(false);
  };

  const getStatusColor = () => {
    switch (rideStatus) {
      case 'pickup': return '#FF9800';
      case 'in-progress': return '#2196F3';
      case 'completed': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'pickup': return 'Heading to Pickup';
      case 'in-progress': return 'Ride in Progress';
      case 'completed': return 'Ride Completed';
      default: return 'Available for Rides';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Ride Management</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: socketConnected ? '#4caf50' : '#f44336' }]} />
            <Text style={styles.connectionText}>
              {socketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {currentRide && (
          <Text style={styles.rideInfo}>
            ${currentRide.fare} • {currentRide.distance}km
          </Text>
        )}
      </View>

      {currentRide && (
        <View style={styles.rideSection}>
          <Text style={styles.sectionTitle}>Current Ride</Text>
          <View style={styles.rideCard}>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{currentRide.rider.name}</Text>
              <Text style={styles.riderRating}>⭐ {currentRide.rider.rating}</Text>
            </View>
            
            <View style={styles.locationInfo}>
              <View style={styles.locationItem}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.locationText}>{currentRide.pickup.address}</Text>
              </View>
              <View style={styles.locationItem}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.locationText}>{currentRide.destination.address}</Text>
              </View>
            </View>

            <View style={styles.rideStats}>
              <Text style={styles.fareText}>${currentRide.fare}</Text>
              <Text style={styles.distanceText}>{currentRide.distance}km</Text>
              <Text style={styles.timeText}>{currentRide.estimatedTime}min</Text>
            </View>

            <View style={styles.actionButtons}>
              {rideStatus === 'pickup' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.navigationButton]}
                    onPress={() => openNavigation(currentRide.pickup)}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Navigate to Pickup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.startButton]}
                    onPress={startRide}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Start Ride</Text>
                  </TouchableOpacity>
                </>
              )}

              {rideStatus === 'in-progress' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.navigationButton]}
                    onPress={() => openNavigation(currentRide.destination)}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Navigate to Destination</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={completeRide}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Complete Ride</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Ride Request Modal */}
      <Modal
        visible={showRideModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Ride Request</Text>
            {currentRide && (
              <View style={styles.modalRideInfo}>
                <Text style={styles.modalRiderName}>{currentRide.rider.name}</Text>
                <Text style={styles.modalFare}>${currentRide.fare}</Text>
                <Text style={styles.modalDistance}>{currentRide.distance}km</Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={rejectRide}
              >
                <Text style={styles.modalButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={acceptRide}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
    color: '#666',
  },
  statusBar: {
    padding: 16,
    alignItems: 'center',
  },
  rideInfo: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  rideSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  riderRating: {
    fontSize: 14,
    color: '#666',
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  rideStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fareText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  navigationButton: {
    backgroundColor: '#1976d2',
  },
  startButton: {
    backgroundColor: '#4caf50',
  },
  completeButton: {
    backgroundColor: '#ff9800',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalRideInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalRiderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalFare: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  modalDistance: {
    fontSize: 14,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
