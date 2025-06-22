import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function UserInfo() {
  const { token, logout } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(await res.json());
      }
    }
    if (token) fetchUser();
  }, [token]);

  if (!user) return null;
  return (
    <div>
      <h3>User Info</h3>
      <div>Name: {user.name}</div>
      <div>Email: {user.email}</div>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
