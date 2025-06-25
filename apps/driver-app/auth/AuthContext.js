import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        // Optionally fetch user info here
        return true;
      } else {
        Alert.alert('Login failed', 'Invalid credentials or not verified.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
