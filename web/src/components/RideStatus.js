import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
// For advanced features, use @react-google-maps/api and Google Directions API

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your key

export default function RideStatus({ ride }) {
  const [status, setStatus] = useState(ride.status);
  const [driver, setDriver] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = io();
    socket.on('ride:status', ({ ride: updatedRide }) => {
      if (updatedRide.id === ride.id) {
        setStatus(updatedRide.status);
      }
    });
    socket.on('driver:locationUpdate', ({ driverId, latitude, longitude }) => {
      if (driver && driver.id === driverId) {
        setDriverLocation({ latitude, longitude });
      }
    });
    return () => socket.disconnect();
  }, [ride.id, driver]);

  useEffect(() => {
    async function fetchDriver() {
      try {
        setLoading(true);
        const res = await fetch(`/api/drivers/${ride.driver_id}`);
        if (!res.ok) throw new Error('Driver not found');
        const data = await res.json();
        setDriver(data);
      } catch (e) {
        setError('Could not load driver info.');
      } finally {
        setLoading(false);
      }
    }
    if (!driver) fetchDriver();
    // Geocode origin for rider location (for demo, use static or mock geocode)
    if (ride.origin && !riderLocation) {
      setRiderLocation({ latitude: 40.7128, longitude: -74.006 }); // Example: NYC
    }
  }, [ride.driver_id, driver, ride.origin, riderLocation]);

  if (loading) {
    return <div style={{textAlign:'center',marginTop:32}}><b>Loading ride info...</b></div>;
  }
  if (error) {
    return <div style={{color:'red',textAlign:'center',marginTop:32}}>{error}</div>;
  }

  // Fetch directions polyline when both locations are available
  useEffect(() => {
    async function fetchDirections() {
      if (driverLocation && riderLocation) {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driverLocation.latitude},${driverLocation.longitude}&destination=${riderLocation.latitude},${riderLocation.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          setPolyline(data.routes[0].overview_polyline.points);
        }
      }
    }
    fetchDirections();
  }, [driverLocation, riderLocation]);

  // Map rendering (use Google Maps embed for demo, upgrade to @react-google-maps/api for full interactivity)
  const mapUrl = driverLocation && riderLocation
    ? `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${driverLocation.latitude},${driverLocation.longitude}&destination=${riderLocation.latitude},${riderLocation.longitude}&mode=driving`
    : null;

  return (
    <div>
      <h2>Ride Status: {status}</h2>
      {driver && (
        <div>
          <div>Driver: {driver.name}</div>
          <div>Car: {driver.car_info}</div>
          {driverLocation && riderLocation && (
            <div>
              <div>Driver Location: {driverLocation.latitude}, {driverLocation.longitude}</div>
              <div>Rider Location: {riderLocation.latitude}, {riderLocation.longitude}</div>
              <div style={{marginTop:8}}>
                {mapUrl ? (
                  <iframe
                    title="Live Map"
                    width="400"
                    height="300"
                    frameBorder="0"
                    src={mapUrl}
                    style={{ border: 0, borderRadius: 8 }}
                    allowFullScreen
                  />
                ) : (
                  <div>Loading map...</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
