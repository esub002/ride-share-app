import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, Switch, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';

function NotificationBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <TouchableOpacity style={styles.banner} onPress={onClose} activeOpacity={0.8}>
      <Text style={{ color: '#fff' }}>{message}</Text>
      <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 10 }}>×</Text>
    </TouchableOpacity>
  );
}

export default function DriverHomeScreen({ driverId }) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [error, setError] = useState('');
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [notification, setNotification] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/drivers/${driverId}`);
        const data = await res.json();
        setAvailable(data.available);
      } catch (e) {
        setError('Could not load driver info.');
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, [driverId]);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;
    socket.on('ride:requested', ({ ride, driver }) => {
      if (driver.id === driverId) {
        setRideRequests((prev) => [...prev, ride]);
        setNotification('New ride request received!');
      }
    });
    socket.on('ride:status', ({ rideId, status }) => {
      if (activeRide && rideId === activeRide.id) {
        setActiveRide({ ...activeRide, status });
        if (status === 'completed') setNotification('Ride completed!');
        else if (status === 'in_progress') setNotification('Ride started!');
        else if (status === 'accepted') setNotification('Ride accepted!');
      }
    });
    socket.on('ride:cancelled', ({ rideId }) => {
      if (activeRide && rideId === activeRide.id) {
        setActiveRide(null);
        setNotification('Ride was cancelled by rider.');
      }
    });
    socket.on('ride:chat', ({ rideId, sender, message, timestamp }) => {
      if (activeRide && rideId === activeRide.id) {
        setChat((prev) => [...prev, { sender, message, timestamp: timestamp || new Date().toISOString() }]);
        if (sender !== 'driver') setNotification('New message from rider');
      }
    });
    return () => socket.disconnect();
  }, [driverId, activeRide]);

  const toggleAvailability = async () => {
    setLoading(true);
    try {
      await fetch(`http://localhost:3000/api/drivers/${driverId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !available })
      });
      setAvailable((a) => !a);
    } catch (e) {
      setError('Could not update availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (rideId) => {
    setLoading(true);
    try {
      await fetch(`http://localhost:3000/api/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      });
      const ride = rideRequests.find((r) => r.id === rideId);
      setActiveRide({ ...ride, status: 'accepted' });
      setRideRequests((prev) => prev.filter((r) => r.id !== rideId));
    } catch (e) {
      setError('Could not accept ride.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = (rideId) => {
    setRideRequests((prev) => prev.filter((r) => r.id !== rideId));
  };

  const handleStatusUpdate = (status) => {
    if (activeRide) {
      socketRef.current.emit('ride:statusUpdate', {
        rideId: activeRide.id,
        status,
        driverId,
        userId: activeRide.rider_id,
      });
      setActiveRide({ ...activeRide, status });
    }
  };

  const handleSendChat = () => {
    if (activeRide && chatInput.trim()) {
      const timestamp = new Date().toISOString();
      socketRef.current.emit('ride:chat', {
        rideId: activeRide.id,
        sender: 'driver',
        message: chatInput.trim(),
        timestamp,
      });
      setChat((prev) => [...prev, { sender: 'driver', message: chatInput.trim(), timestamp }]);
      setChatInput('');
    }
  };

  const closeNotification = () => setNotification('');

  return (
    <View style={{ padding: 20 }}>
      <NotificationBanner message={notification} onClose={closeNotification} />
      <Text style={{ fontSize: 24 }}>Driver Home</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
        <Text>Available: </Text>
        <Switch value={available} onValueChange={toggleAvailability} disabled={loading} />
        {loading && <ActivityIndicator style={{ marginLeft: 10 }} />}
      </View>
      {activeRide ? (
        <View style={{ marginVertical: 20, padding: 10, borderWidth: 1, borderRadius: 8 }}>
          <Text>Active Ride</Text>
          <Text>From: {activeRide.origin}</Text>
          <Text>To: {activeRide.destination}</Text>
          <Text>Status: {activeRide.status}</Text>
          <Button title="Start Ride" onPress={() => handleStatusUpdate('in_progress')} />
          <Button title="Complete Ride" onPress={() => handleStatusUpdate('completed')} />
          <Button title="Cancel Ride" onPress={() => handleStatusUpdate('cancelled')} />
          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Chat</Text>
          <FlatList
            data={chat}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={item.sender === 'driver' ? styles.bubbleDriver : styles.bubbleRider}>
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
      ) : (
        <>
          <Text style={{ fontWeight: 'bold', marginTop: 20 }}>New Ride Requests:</Text>
          <FlatList
            data={rideRequests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={{ marginVertical: 10, padding: 10, borderWidth: 1, borderRadius: 8 }}>
                <Text>From: {item.origin}</Text>
                <Text>To: {item.destination}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <Button title="Accept" onPress={() => handleAccept(item.id)} />
                  <View style={{ width: 10 }} />
                  <Button title="Decline" onPress={() => handleDecline(item.id)} />
                </View>
              </View>
            )}
            ListEmptyComponent={<Text>No new ride requests.</Text>}
          />
        </>
      )}
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
    </View>
  );
}

const styles = {
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
};
