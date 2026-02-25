import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';

const AuthContext = createContext(null);

// Create api instance ONCE at module level, shared across all components
const api = axios.create({
  baseURL: getApiUrl(),
});

// Add request interceptor to include token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tbToken = localStorage.getItem('tbToken');

  console.log('[API Request]', config.url, 'Token:', token ? 'YES' : 'NO');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tbToken) {
    config.headers['X-TB-Token'] = tbToken;
  }
  return config;
});

// Add response interceptor to handle 401s globally at module level
api.interceptors.response.use(
  (response) => {
    console.log('[API Response] Success:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('[API Response] Error:', error.config?.url, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Token is invalid, clear auth state
      localStorage.removeItem('token');
      localStorage.removeItem('tbToken');
      localStorage.removeItem('tbRefreshToken');
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });
  const [tbToken, setTbToken] = useState(() => {
    return localStorage.getItem('tbToken') || null;
  });
  const [tbRefreshToken, setTbRefreshToken] = useState(() => {
    return localStorage.getItem('tbRefreshToken') || null;
  });
  const [loading, setLoading] = useState(true);

  // Fetch user on mount if token exists
  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      // Call /users/me with explicit token header
      api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        }
      })
        .then(res => {
          const userData = res.data;
          // Parse roles from comma-separated string
          if (userData.role) {
            userData.roles = userData.role.split(',').map(r => r.trim());
          } else {
            userData.roles = [];
          }
          setUser(userData);
          setToken(storedToken);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch user on mount:", err.response?.status, err.response?.data);
          // Clear invalid token
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Automatic Token Refresh Logic
  useEffect(() => {
    let intervalId;

    if (tbToken && tbRefreshToken) {
      // Refresh every 15 minutes (900000 ms)
      intervalId = setInterval(async () => {
        try {
          const res = await api.post('/tb/auth/token', { refresh_token: tbRefreshToken });
          const { token: newToken, refreshToken: newRefreshToken } = res.data;

          setTbToken(newToken);
          setTbRefreshToken(newRefreshToken);
          localStorage.setItem('tbToken', newToken);
          localStorage.setItem('tbRefreshToken', newRefreshToken);
        } catch (error) {
          console.error("Failed to refresh TB token", error);
        }
      }, 15 * 60 * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [tbToken, tbRefreshToken]);

  const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await api.post('/token', formData);
      const { access_token, tb_token, tb_refresh_token } = res.data;

      // Store token in localStorage first
      localStorage.setItem('token', access_token);
      setToken(access_token);

      if (tb_token) {
        setTbToken(tb_token);
        localStorage.setItem('tbToken', tb_token);
      }
      if (tb_refresh_token) {
        setTbRefreshToken(tb_refresh_token);
        localStorage.setItem('tbRefreshToken', tb_refresh_token);
      }

      // Fetch user details with explicit header
      const userRes = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        }
      });
      const userData = userRes.data;
      if (userData.role) {
        userData.roles = userData.role.split(',').map(r => r.trim());
      } else {
        userData.roles = [];
      }
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const loginTB = async (username, password) => {
    try {
      const res = await api.post('/tb/login', { username, password });
      const { token, refreshToken } = res.data;
      setTbToken(token);
      setTbRefreshToken(refreshToken);
      localStorage.setItem('tbToken', token);
      localStorage.setItem('tbRefreshToken', refreshToken);
      return true;
    } catch (error) {
      console.error("TB Login failed", error);
      return false;
    }
  };

  const logout = async () => {
    if (tbToken) {
      try {
        await api.post('/tb/auth/logout');
      } catch (e) {
        console.error("TB Logout failed", e);
      }
    }
    setUser(null);
    setToken(null);
    setTbToken(null);
    setTbRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('tbToken');
    localStorage.removeItem('tbRefreshToken');
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/users/me', data);
      setUser(res.data);
      return { success: true };
    } catch (error) {
      console.error("Update profile failed", error);
      return { success: false, message: error.response?.data?.detail || "Update failed" };
    }
  };

  // Remove the response interceptor here - it's already at module level



  return (
    <AuthContext.Provider value={{ user, setUser, token, tbToken, login, loginTB, logout, updateProfile, loading, api, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
