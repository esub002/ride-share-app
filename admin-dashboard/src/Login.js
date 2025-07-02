import React, { useState } from 'react';

export default function Login({ onLogin, onSkip }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    // Replace with real API call
    if (email === 'admin@example.com' && password === 'admin123') {
      onLogin('demo-jwt-token');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{ maxWidth: 320, margin: '100px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', marginBottom: 8, padding: 8 }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', marginBottom: 8, padding: 8 }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 8, marginBottom: 8 }}>Login</button>
      </form>
      <button onClick={onSkip} style={{ width: '100%', padding: 8, background: '#eee' }}>Skip & Continue Setup</button>
    </div>
  );
}