import React, { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import UserInfo from './components/Auth/UserInfo';
import ProtectedRoute from './components/ProtectedRoute';
import PasswordReset from './components/Auth/PasswordReset';
import EmailVerificationPrompt from './components/Auth/EmailVerificationPrompt';
import RideRequest from './components/RideRequest';
import RideStatus from './components/RideStatus';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const { token, user } = useAuth();

  // Example role-based access (expand as needed)
  const isAdmin = user && user.role === 'admin';

  return (
    <AuthProvider>
      <div>
        <h1>Ride Share Web App</h1>
        {token ? (
          <>
            <UserInfo />
            {/* Show email verification prompt if needed */}
            {user && !user.verified && <EmailVerificationPrompt email={user.email} />}
            <ProtectedRoute>
              <div>Protected content goes here.</div>
              {isAdmin && <div>Admin-only content here.</div>}
            </ProtectedRoute>
          </>
        ) : (
          <>
            {showRegister ? (
              <Register onSuccess={() => setShowRegister(false)} />
            ) : showReset ? (
              <PasswordReset />
            ) : (
              <Login />
            )}
            <button onClick={() => setShowRegister(r => !r)}>
              {showRegister ? 'Back to Login' : 'Register'}
            </button>
            <button onClick={() => setShowReset(r => !r)}>
              {showReset ? 'Back to Login' : 'Forgot Password?'}
            </button>
          </>
        )}
        {!currentRide ? (
          <RideRequest onRequested={setCurrentRide} />
        ) : (
          <RideStatus ride={currentRide} />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
