import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';

export default function MobileSignupScreen({ onSwitch }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setMessage('');
    try {
      const res = await fetch('http://10.0.0.244:3000/api/auth/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) setMessage('Signup successful! Please check your email to verify.');
      else setMessage(data.error || 'Signup failed');
    } catch (e) {
      setMessage('Network error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile Sign Up</Text>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <Button title="Sign Up" onPress={handleSubmit} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <TouchableOpacity onPress={onSwitch} style={styles.switchBtn}>
        <Text style={{ color: '#ee0979' }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#0fd850' },
  input: { width: 250, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  message: { marginTop: 16, color: '#27ae60' },
  switchBtn: { marginTop: 24 },
});
