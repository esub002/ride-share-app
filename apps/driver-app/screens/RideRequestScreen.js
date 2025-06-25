import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';

export default function RideRequestScreen({ onRequested }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination })
      });
      if (res.ok) {
        const ride = await res.json();
        onRequested(ride);
      } else {
        setError('No available drivers or request failed.');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Request a Ride</Text>
      <TextInput placeholder="Origin" value={origin} onChangeText={setOrigin} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <TextInput placeholder="Destination" value={destination} onChangeText={setDestination} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <Button title={loading ? 'Requesting...' : 'Request Ride'} onPress={handleRequest} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
    </View>
  );
}
