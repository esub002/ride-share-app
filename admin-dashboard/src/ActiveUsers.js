import React, { useEffect, useState } from 'react';
import { getActiveDrivers, getActiveRiders } from './api';

export default function ActiveUsers() {
  const [drivers, setDrivers] = useState([]);
  const [riders, setRiders] = useState([]);
  useEffect(() => {
    getActiveDrivers().then(res => setDrivers(res.data.data.items || []));
    getActiveRiders().then(res => setRiders(res.data.data.items || []));
  }, []);
  return (
    <div>
      <h2>Active Drivers</h2>
      <ul>{drivers.map(d => <li key={d.id}>{d.name} ({d.email})</li>)}</ul>
      <h2>Active Riders</h2>
      <ul>{riders.map(r => <li key={r.id}>{r.name} ({r.email})</li>)}</ul>
    </div>
  );
}