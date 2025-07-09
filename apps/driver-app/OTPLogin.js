import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import apiService from './utils/api';

export default function OTPLogin({ navigation }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Check if phone exists, then send OTP or go to signup
  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.checkPhoneExists(phone);
      if (res.success && res.exists) {
        // Phone exists, proceed with OTP
        const confirmation = await auth().signInWithPhoneNumber(phone);
        setConfirm(confirmation);
      } else if (res.success && !res.exists) {
        // Phone does not exist, go to signup
        Alert.alert('Not Registered', 'Phone number not found. Please sign up.', [
          { text: 'OK', onPress: () => navigation.navigate('Signup', { phone }) }
        ]);
      } else {
        setError(res.error || 'Failed to check phone');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm OTP
  const confirmOTP = async () => {
    try {
      await confirm.confirm(code);
      setError('');
      // User is now signed in!
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {!confirm ? (
        <>
          <TextInput
            placeholder="Phone (+1234567890)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, width: '100%' }}
          />
          <Button title={loading ? 'Checking...' : 'Send OTP'} onPress={handleSendOTP} disabled={loading} />
        </>
      ) : (
        <>
          <TextInput
            placeholder="Enter OTP"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, width: '100%' }}
          />
          <Button title="Verify OTP" onPress={confirmOTP} />
        </>
      )}
      {error ? <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text> : null}
    </View>
  );
} 