import React, { useState } from 'react';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    const res = await fetch('/api/auth/user/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      setMessage('Check your email for a reset link or token.');
      setStep(2);
    } else {
      setError('Could not send reset email.');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    const res = await fetch('/api/auth/user/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword })
    });
    if (res.ok) {
      setMessage('Password reset successful! You can now log in.');
      setStep(1);
    } else {
      setError('Invalid or expired token.');
    }
  };

  return (
    <div>
      <h2>Password Reset</h2>
      {step === 1 ? (
        <form onSubmit={handleRequest}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
          <button type="submit">Request Reset</button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Reset Token" required />
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" required />
          <button type="submit">Set New Password</button>
        </form>
      )}
      {error && <div style={{color:'red'}}>{error}</div>}
      {message && <div style={{color:'green'}}>{message}</div>}
    </div>
  );
}
