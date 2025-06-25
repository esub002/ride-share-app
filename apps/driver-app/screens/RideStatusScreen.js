import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ActivityIndicator, FlatList, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import io from 'socket.io-client';

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your key

function NotificationBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <TouchableOpacity style={styles.banner} onPress={onClose} activeOpacity={0.8}>
      <Text style={{ color: '#fff' }}>{message}</Text>
      <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 10 }}>×</Text>
    </TouchableOpacity>
  );
}

export default function RideStatusScreen({ ride, userId }) {
  const [status, setStatus] = useState(ride.status);
  const [driver, setDriver] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [notification, setNotification] = useState('');
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;
    socket.on('ride:status', ({ rideId, status: newStatus }) => {
      if (rideId === ride.id) {
        setStatus(newStatus);
        if (newStatus === 'completed') {
          setNotification('Your ride has been completed.');
        } else if (newStatus === 'in_progress') {
          setNotification('Your ride is now in progress.');
        } else if (newStatus === 'accepted') {
          setNotification('Your ride has been accepted by the driver.');
        }
      }
    });
    socket.on('ride:cancelled', ({ rideId }) => {
      if (rideId === ride.id) {
        setError('Ride was cancelled by driver.');
        setNotification('Your ride was cancelled by the driver.');
      }
    });
    socket.on('ride:chat', ({ rideId, sender, message, timestamp }) => {
      if (rideId === ride.id) {
        setChat((prev) => [...prev, { sender, message, timestamp: timestamp || new Date().toISOString() }]);
        if (sender !== 'rider') setNotification('New message from driver');
      }
    });
    socket.on('driver:locationUpdate', ({ driverId, latitude, longitude }) => {
      if (driver && driver.id === driverId) {
        setDriverLocation({ latitude, longitude });
      }
    });
    return () => socket.disconnect();
  }, [ride.id, driver]);

  useEffect(() => {
    async function fetchDriver() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3000/api/drivers/${ride.driver_id}`);
        if (!res.ok) throw new Error('Driver not found');
        const data = await res.json();
        setDriver(data);
      } catch (e) {
        setError('Could not load driver info.');
      } finally {
        setLoading(false);
      }
    }
    if (!driver) fetchDriver();
    if (ride.origin && !riderLocation) {
      setRiderLocation({ latitude: 40.7128, longitude: -74.006 }); // Example: NYC
    }
  }, [ride.driver_id, driver, ride.origin, riderLocation]);

  useEffect(() => {
    if (mapRef.current && driverLocation && riderLocation) {
      mapRef.current.fitToCoordinates([
        driverLocation,
        riderLocation
      ], { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true });
    }
  }, [driverLocation, riderLocation]);

  const handleSendChat = () => {
    if (ride && chatInput.trim()) {
      const timestamp = new Date().toISOString();
      socketRef.current.emit('ride:chat', {
        rideId: ride.id,
        sender: 'rider',
        message: chatInput.trim(),
        timestamp,
      });
      setChat((prev) => [...prev, { sender: 'rider', message: chatInput.trim(), timestamp }]);
      setChatInput('');
    }
  };

  const closeNotification = () => setNotification('');

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /><Text>Loading ride info...</Text></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }

  return (
    <View style={{ padding: 20 }}>
      <NotificationBanner message={notification} onClose={closeNotification} />
      <Text style={{ fontSize: 24 }}>Ride Status: {status}</Text>
      {driver && (
        <View>
          <Text>Driver: {driver.name}</Text>
          <Text>Car: {driver.car_info}</Text>
          {driverLocation && riderLocation && (
            <View style={{marginTop:8}}>
              <Text>Driver Location: {driverLocation.latitude}, {driverLocation.longitude}</Text>
              <Text>Rider Location: {riderLocation.latitude}, {riderLocation.longitude}</Text>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: riderLocation.latitude,
                  longitude: riderLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                customMapStyle={customMapStyle}
              >
                <Marker coordinate={riderLocation} title="Rider">
                  <Image source={require('../assets/rider.png')} style={{width:32,height:32}} />
                </Marker>
                <Marker coordinate={driverLocation} title="Driver">
                  <Image source={require('../assets/driver.png')} style={{width:32,height:32}} />
                </Marker>
                <MapViewDirections
                  origin={driverLocation}
                  destination={riderLocation}
                  apikey={GOOGLE_MAPS_API_KEY}
                  strokeWidth={4}
                  strokeColor="#1E90FF"
                  onError={() => setError('Could not load directions.')}
                  onReady={() => setLoading(false)}
                />
              </MapView>
            </View>
          )}
          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Chat</Text>
          <FlatList
            data={chat}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={item.sender === 'rider' ? styles.bubbleRider : styles.bubbleDriver}>
                <Text style={{ color: '#fff' }}>{item.message}</Text>
                <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            )}
            style={{ maxHeight: 120 }}
            contentContainerStyle={{ paddingVertical: 4 }}
          />
          <View style={{ flexDirection: 'row', marginTop: 5 }}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a message"
              style={{ borderWidth: 1, flex: 1, marginRight: 5, padding: 4, borderRadius: 6 }}
            />
            <Button title="Send" onPress={handleSendChat} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get('window').width - 40,
    height: 250,
    borderRadius: 12,
  },
  banner: {
    backgroundColor: '#1E90FF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  bubbleRider: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-end',
    marginVertical: 2,
    padding: 8,
    borderRadius: 12,
    maxWidth: '80%',
  },
  bubbleDriver: {
    backgroundColor: '#2196F3',
    alignSelf: 'flex-start',
    marginVertical: 2,
    padding: 8,
    borderRadius: 12,
    maxWidth: '80%',
  },
  timestamp: {
    color: '#eee',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
});

const customMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] }
];
