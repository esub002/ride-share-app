import React, { useEffect, useState } from 'react';
import { getSOSAlerts } from './api';
import { io } from 'socket.io-client';

export default function SOSAlerts() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    getSOSAlerts().then(res => setAlerts(res.data.data.items || []));
    const socket = io('http://localhost:3000', { transports: ['websocket'] });
    socket.on('emergency:alert', alert => setAlerts(a => [alert, ...a]));
    return () => socket.disconnect();
  }, []);
  return (
    <div>
      <h2>SOS Alerts</h2>
      <ul>
        {alerts.map(a => (
          <li key={a.id || a.timestamp}>
            {a.type} at {a.location} ({a.description})
          </li>
        ))}
      </ul>
    </div>
  );
}