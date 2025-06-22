import React, { useState } from 'react';

export default function RideRequest({ onRequested }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
    <form onSubmit={handleSubmit}>
      <h2>Request a Ride</h2>
      <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origin" required disabled={loading} />
      <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination" required disabled={loading} />
      <button type="submit" disabled={loading}>{loading ? 'Requesting...' : 'Request Ride'}</button>
      {loading && <div style={{marginTop:8}}>Loading...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
}
