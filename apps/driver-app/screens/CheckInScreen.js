import React, { useState, useEffect } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  reconnection: true,
});

export default function CheckInScreen() {
  const [status, setStatus] = useState('Connecting...');
  const [checkedIn, setCheckedIn] = useState(false);
  const [role, setRole] = useState('rider');

  useEffect(() => {
    socket.on('connect', () => setStatus('Connected'));
    socket.on('disconnect', () => setStatus('Disconnected'));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const handleCheckIn = () => {
    if (role === 'driver') {
      socket.emit('driver:available', { driverId: Math.floor(Math.random() * 1000) });
      setCheckedIn(true);
    } else {
      socket.emit('ride:request', {
        origin: 'Central Park',
        destination: 'Wall Street',
        riderId: Math.floor(Math.random() * 1000),
      });
      setCheckedIn(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Hello</Text>
      <Text style={styles.title}>Real-Time Check-In</Text>
      <Text>Status: <Text style={{ fontWeight: 'bold' }}>{status}</Text></Text>
      <View style={styles.roleRow}>
        <TouchableOpacity onPress={() => setRole('rider')} style={[styles.roleBtn, role === 'rider' && styles.selected]}>
          <Text>Rider</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('driver')} style={[styles.roleBtn, role === 'driver' && styles.selected]}>
          <Text>Driver</Text>
        </TouchableOpacity>
      </View>
      <Button title={checkedIn ? 'Checked In!' : 'Check In'} onPress={handleCheckIn} disabled={checkedIn} />
      {checkedIn && <Text style={{ marginTop: 20 }}>You are checked in as a <Text style={{ fontWeight: 'bold' }}>{role}</Text>.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  roleRow: { flexDirection: 'row', marginVertical: 24 },
  roleBtn: { padding: 12, borderWidth: 1, borderColor: '#888', borderRadius: 8, marginHorizontal: 10 },
  selected: { backgroundColor: '#e0e0e0' },
});
