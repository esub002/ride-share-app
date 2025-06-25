import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError(''); setMessage('');
    const res = await fetch('http://localhost:3000/api/auth/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (res.ok) {
      setMessage('Registration successful! Check your email to verify.');
    } else {
      const data = await res.json();
      setError(data.error || 'Registration failed');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Register</Text>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <Button title="Register" onPress={handleRegister} />
      <Button title="Back to Login" onPress={() => navigation.navigate('Login')} />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      {message ? <Text style={{ color: 'green' }}>{message}</Text> : null}
    </View>
  );
}
