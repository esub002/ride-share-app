import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import socket from '../utils/socket';
import firebaseServiceManager from './firebaseConfig';

// Memoized ride card component for better performance
const RideCard = React.memo(({ ride, onAccept, onReject }) => (
  <View style={styles.rideCard}>
    <View style={styles.rideInfo}>
      <View style={styles.rideHeader}>
        <Ionicons name="location" size={16} color="#1976d2" />
        <Text style={styles.rideLocation}>
          {ride.pickupLocation || 'Pickup Location'}
        </Text>
      </View>
      <View style={styles.rideHeader}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.rideDestination}>
          {ride.destination || 'Destination'}
        </Text>
      </View>
      <View style={styles.rideDetails}>
        <Text style={styles.ridePrice}>
          ${ride.estimatedPrice || '15.00'}
        </Text>
        <Text style={styles.rideDistance}>
          {ride.distance || '2.5'} km
        </Text>
      </View>
    </View>
    
    <View style={styles.rideActions}>
      <TouchableOpacity
        style={[styles.actionButton, styles.acceptButton]}
        onPress={() => onAccept(ride.rideId)}
      >
        <Ionicons name="checkmark" size={20} color="white" />
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, styles.rejectButton]}
        onPress={() => onReject(ride.rideId)}
      >
        <Ionicons name="close" size={20} color="white" />
        <Text style={styles.rejectButtonText}>Reject</Text>
      </TouchableOpacity>
    </View>
  </View>
));

// Memoized map component
const DashboardMap = React.memo(() => (
  <View style={styles.mapContainer}>
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      loadingEnabled={true}
      loadingIndicatorColor="#1976d2"
      loadingBackgroundColor="#ffffff"
    />
  </View>
));

export default function Dashboard() {
  const driverId = 2;
  const [rideRequests, setRideRequests] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [driverStats, setDriverStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Memoized callbacks to prevent unnecessary re-renders
  const acceptRide = useCallback((rideId) => {
    socket.emit('ride:accept', { rideId, driverId });
    setRideRequests(prev => prev.filter(ride => ride.rideId !== rideId));
    Alert.alert('Ride Accepted', 'You have accepted the ride request.');
  }, [driverId]);

  const rejectRide = useCallback((rideId) => {
    socket.emit('ride:reject', { rideId, driverId });
    setRideRequests(prev => prev.filter(ride => ride.rideId !== rideId));
  }, [driverId]);

  // Socket connection management
  useEffect(() => {
    const handleConnect = () => {
      setSocketConnected(true);
      console.log('Socket connected');
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
      console.log('Socket disconnected');
    };

    const handleRideIncoming = (data) => {
      setRideRequests(prev => [...prev, data]);
    };

    // Set up socket event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('ride:incoming', handleRideIncoming);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('ride:incoming', handleRideIncoming);
    };
  }, []);

  // Firestore real-time listener for driver stats
  useEffect(() => {
    let unsubscribe;
    const listenToDriverStats = async () => {
      await firebaseServiceManager.initialize();
      const firestore = firebaseServiceManager.getFirestore();
      const { doc, onSnapshot } = await import('firebase/firestore');
      unsubscribe = onSnapshot(
        doc(firestore.db, 'drivers', String(driverId)),
        (docSnap) => {
          if (docSnap.exists()) {
            setDriverStats(docSnap.data());
          }
          setLoadingStats(false);
        },
        (error) => {
          setLoadingStats(false);
        }
      );
    };
    listenToDriverStats();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [driverId]);

  // Memoized ride requests list
  const rideRequestsList = useMemo(() => {
    if (rideRequests.length === 0) {
      return (
        <View style={styles.noRidesContainer}>
          <Ionicons name="time-outline" size={48} color="#ccc" />
          <Text style={styles.noRidesText}>No ride requests yet</Text>
          <Text style={styles.noRidesSubtext}>
            Go to Ride Management to go online and receive rides
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.rideList} showsVerticalScrollIndicator={false}>
        {rideRequests.map((ride, index) => (
          <RideCard
            key={ride.rideId || index}
            ride={ride}
            onAccept={acceptRide}
            onReject={rejectRide}
          />
        ))}
      </ScrollView>
    );
  }, [rideRequests, acceptRide, rejectRide]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Driver Dashboard</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: socketConnected ? '#4caf50' : '#f44336' }]} />
            <Text style={styles.connectionText}>
              {socketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </View>

      {/* Compact Map */}
      <DashboardMap />

      {/* Ride Requests Section */}
      <View style={styles.rideRequestsContainer}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="car" size={20} color="#1976d2" /> Available Rides
        </Text>
        {rideRequestsList}
      </View>

      {/* Driver Stats Section */}
      {loadingStats ? (
        <ActivityIndicator size="small" color="#1976d2" style={{ margin: 16 }} />
      ) : driverStats ? (
        <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 8, margin: 16, marginBottom: 0 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Earnings: ${driverStats.totalEarnings || 0}</Text>
          <Text style={{ fontSize: 14, color: '#555' }}>Total Rides: {driverStats.totalRides || 0}</Text>
          <Text style={{ fontSize: 14, color: '#555' }}>Rating: {driverStats.rating || '-'}</Text>
        </View>
      ) : null}
    </View>
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
  mapContainer: {
    margin: 16,
    height: 200,
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
  rideRequestsContainer: {
    flex: 1,
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRidesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  noRidesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  rideList: {
    flex: 1,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideInfo: {
    marginBottom: 12,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  rideLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  rideDestination: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ridePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  rideDistance: {
    fontSize: 14,
    color: '#666',
  },
  rideActions: {
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
  acceptButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
