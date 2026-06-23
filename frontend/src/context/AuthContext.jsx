import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

// Determine standard API URL dynamically
const getApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    envUrl = envUrl.trim();
    if (envUrl.endsWith('/')) {
      envUrl = envUrl.slice(0, -1);
    }
    if (!envUrl.endsWith('/api')) {
      envUrl = `${envUrl}/api`;
    }
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // If the host is NOT localhost/127.0.0.1, we are in production.
    // Ensure we do not use localhost URL even if hardcoded in the env.
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return `${origin}/api`;
      }
    }
  }
  return envUrl || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const savedSession = localStorage.getItem('necleap_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch (e) {
        console.error('Failed to parse saved session:', e);
        localStorage.removeItem('necleap_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user: loggedUser, session } = response.data;

      const sessionData = {
        user: loggedUser,
        token: session.access_token
      };

      localStorage.setItem('necleap_session', JSON.stringify(sessionData));
      setUser(loggedUser);
      setToken(session.access_token);
      return { success: true };
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
        'Could not connect to backend server. Make sure the Node.js backend is running on port 5000.'
      );
    }
  };

  const logout = async () => {
    try {
      if (token && token !== 'mock_offline_token_jwt') {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      localStorage.removeItem('necleap_session');
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { API_URL };
