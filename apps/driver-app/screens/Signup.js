import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import apiService from '../utils/api';

export default function Signup({ navigation, route }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(route.params?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      // You may need to adjust the backend endpoint and payload as needed
      const res = await apiService.request('/auth/driver/register', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.success) {
        Alert.alert('Signup Successful', 'You can now log in with your phone number.', [
          { text: 'OK', onPress: () => navigation.replace('OTPLogin', { phone }) }
        ]);
      } else {
        setError(res.error || 'Signup failed');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, width: '100%' }}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, width: '100%' }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, width: '100%' }}
      />
      <TextInput
        placeholder="Phone (+1234567890)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, width: '100%' }}
      />
      <Button title={loading ? 'Signing up...' : 'Sign Up'} onPress={handleSignup} disabled={loading} />
      {error ? <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text> : null}
    </View>
  );
} 