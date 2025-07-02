import React, { useEffect, useState } from 'react';
import { getEarnings } from './api';

export default function EarningsStats() {
  const [stats, setStats] = useState({});
  useEffect(() => {
    getEarnings().then(res => setStats(res.data.data || {}));
  }, []);
  return (
    <div>
      <h2>Driver Earnings</h2>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}