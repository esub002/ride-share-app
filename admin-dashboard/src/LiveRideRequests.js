import React, { useEffect, useState } from 'react';
import { getLiveRideRequests } from './api';

export default function LiveRideRequests() {
  const [rides, setRides] = useState([]);
  useEffect(() => {
    getLiveRideRequests().then(res => setRides(res.data.data.items || []));
  }, []);
  return (
    <div>
      <h2>Live Ride Requests</h2>
      <ul>
        {rides.map(ride => (
          <li key={ride.id}>{ride.pickup} → {ride.destination} (Status: {ride.status})</li>
        ))}
      </ul>
    </div>
  );
}