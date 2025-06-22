import React from 'react';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <div>Please log in to access this page.</div>;
  }
  return children;
}
