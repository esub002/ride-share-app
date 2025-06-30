import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

function haversineDistance(coord1, coord2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // meters
  const φ1 = toRad(coord1.latitude);
  const φ2 = toRad(coord2.latitude);
  const Δφ = toRad(coord2.latitude - coord1.latitude);
  const Δλ = toRad(coord2.longitude - coord1.longitude);
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in meters
}

export default function RideRequestModal({
  visible,
  onAccept,
  onReject,
  driverLocation,
  pickupLocation,
  riderName = 'Rider',
  loading = false,
}) {
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (driverLocation && pickupLocation) {
      const distMeters = haversineDistance(driverLocation, pickupLocation);
      setDistance((distMeters / 1609.34).toFixed(2)); // miles
      // Assume average speed 25 mph for ETA
      const etaMinutes = ((distMeters / 1609.34) / 25 * 60).toFixed(0);
      setEta(etaMinutes);
      // Fit map to markers
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates([driverLocation, pickupLocation], {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }, 500);
    }
  }, [driverLocation, pickupLocation]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>New Ride Request</Text>
          <Text style={styles.subtitle}>Pickup for <Text style={{fontWeight:'bold'}}>{riderName}</Text></Text>
          <View style={styles.mapContainer}>
            {driverLocation && pickupLocation ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: (driverLocation.latitude + pickupLocation.latitude) / 2,
                  longitude: (driverLocation.longitude + pickupLocation.longitude) / 2,
                  latitudeDelta: Math.abs(driverLocation.latitude - pickupLocation.latitude) + 0.02,
                  longitudeDelta: Math.abs(driverLocation.longitude - pickupLocation.longitude) + 0.02,
                }}
                showsUserLocation={true}
                pointerEvents="none"
              >
                {driverLocation && typeof driverLocation.latitude === 'number' && typeof driverLocation.longitude === 'number' && (
                  <Marker coordinate={driverLocation} title="Your Location">
                    <Ionicons name="car" size={28} color="#1976d2" />
                  </Marker>
                )}
                {pickupLocation && typeof pickupLocation.latitude === 'number' && typeof pickupLocation.longitude === 'number' && (
                  <Marker coordinate={pickupLocation} title="Pickup Location">
                    <Ionicons name="person" size={28} color="#4CAF50" />
                  </Marker>
                )}
                <Polyline
                  coordinates={[driverLocation, pickupLocation]}
                  strokeWidth={4}
                  strokeColor="#1976d2"
                />
              </MapView>
            ) : (
              <View style={styles.loadingMap}><ActivityIndicator size="large" color="#1976d2" /></View>
            )}
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#1976d2" />
            <Text style={styles.infoText}>Distance: {distance ? `${distance} mi` : '--'}</Text>
            <Ionicons name="time" size={20} color="#1976d2" style={{marginLeft:16}} />
            <Text style={styles.infoText}>ETA: {eta ? `${eta} min` : '--'}</Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onReject} disabled={loading}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept} disabled={loading}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 6,
    marginRight: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  acceptButton: {
    backgroundColor: '#1976d2',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 