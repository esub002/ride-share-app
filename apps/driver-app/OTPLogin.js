import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import auth from '@react-native-firebase/auth';

export default function OTPLogin() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');

  // Step 1: Send OTP
  const sendOTP = async () => {
    try {
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setConfirm(confirmation);
      setError('');
    } catch (e) {
      setError(e.message);
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
          <Button title="Send OTP" onPress={sendOTP} />
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