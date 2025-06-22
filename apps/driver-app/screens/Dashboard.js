import React, { useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import socket from '../utils/socket';

export default function Dashboard() {
  const driverId = 2;

  useEffect(() => {
    socket.emit('driver:available', { driverId });

    socket.on('ride:incoming', (data) => {
      Alert.alert('Incoming Ride', JSON.stringify(data));
      // Accept the ride
      socket.emit('ride:accept', {
        rideId: data.rideId,
        driverId
      });
    });

    return () => {
      socket.off('ride:incoming');
    };
  }, []);

  return (
    <View>
      <Text>Driver Online</Text>
    </View>
  );
}
