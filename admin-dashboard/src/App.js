import React, { useState } from 'react';
import LiveRideRequests from './LiveRideRequests';
import ActiveUsers from './ActiveUsers';
import SOSAlerts from './SOSAlerts';
import EarningsStats from './EarningsStats';
import GrafanaEmbed from './GrafanaEmbed';
import Login from './Login';

function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [skipped, setSkipped] = useState(false);

  const handleLogin = (jwt) => {
    setToken(jwt);
    localStorage.setItem('admin_token', jwt);
  };

  const handleSkip = () => {
    setSkipped(true);
  };

  if (!token && !skipped) {
    return <Login onLogin={handleLogin} onSkip={handleSkip} />;
  }

  return (
    <div>
      <h1>Ride Share Admin Dashboard</h1>
      <LiveRideRequests />
      <ActiveUsers />
      <SOSAlerts />
      <EarningsStats />
      <GrafanaEmbed />
    </div>
  );
}

export default App;