import React, { useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import socket from '../utils/socket';

export default function HomeScreen() {
  useEffect(() => {
    socket.on('ride:assigned', (data) => {
      Alert.alert('Ride Assigned!', JSON.stringify(data));
    });

    socket.on('ride:noDrivers', () => {
      Alert.alert('No Drivers Available');
    });

    return () => {
      socket.off('ride:assigned');
      socket.off('ride:noDrivers');
    };
  }, []);

  const requestRide = () => {
    socket.emit('ride:request', {
      origin: 'Central Park',
      destination: 'Times Square',
      riderId: 1
    });
  };

  return (
    <View>
      <Text>Request a Ride</Text>
      <Button title="Book Ride" onPress={requestRide} />
    </View>
  );
}
