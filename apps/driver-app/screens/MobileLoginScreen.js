import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';

export default function MobileLoginScreen({ onSwitch, onGoogleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setMessage('');
    try {
      const res = await fetch('http://10.0.0.244:3000/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) setMessage('Login successful!');
      else setMessage(data.error || 'Login failed');
    } catch (e) {
      setMessage('Network error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <Button title="Login" onPress={handleSubmit} />
      <TouchableOpacity onPress={onGoogleLogin} style={styles.googleBtn}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Login with Google</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <TouchableOpacity onPress={onSwitch} style={styles.switchBtn}>
        <Text style={{ color: '#0fd850' }}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#ee0979' },
  input: { width: 250, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  googleBtn: { backgroundColor: '#4285F4', padding: 12, borderRadius: 8, marginTop: 16, marginBottom: 8 },
  message: { marginTop: 16, color: '#27ae60' },
  switchBtn: { marginTop: 24 },
});
