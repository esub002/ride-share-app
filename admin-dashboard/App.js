import React, { useState } from 'react';
import LiveRideRequests from './components/LiveRideRequests';
import ActiveUsers from './components/ActiveUsers';
import SOSAlerts from './components/SOSAlerts';
import EarningsStats from './components/EarningsStats';
import GrafanaEmbed from './components/GrafanaEmbed';
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