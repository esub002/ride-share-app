import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const success = await login(email, password);
    if (!success) setError('Invalid credentials or not verified.');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Register" onPress={() => navigation.navigate('Register')} />
      <Button title="Forgot Password?" onPress={() => navigation.navigate('PasswordReset')} />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
    </View>
  );
}
