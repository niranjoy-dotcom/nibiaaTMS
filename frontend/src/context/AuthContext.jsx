import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tbToken, setTbToken] = useState(localStorage.getItem('tbToken'));
  const [tbRefreshToken, setTbRefreshToken] = useState(localStorage.getItem('tbRefreshToken'));
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: getApiUrl(),
  });

  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tbToken) {
      config.headers['X-TB-Token'] = tbToken;
    }
    return config;
  });

  useEffect(() => {
    if (token) {
      api.get(`/users/me?t=${new Date().getTime()}`)
        .then(res => {
          const userData = res.data;
          if (userData.role) {
            userData.roles = userData.role.split(',').map(r => r.trim());
          } else {
            userData.roles = [];
          }
          setUser(userData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch user in effect", err);
          logout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

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
      
      setToken(access_token);
      localStorage.setItem('token', access_token);

      if (tb_token) {
        setTbToken(tb_token);
        localStorage.setItem('tbToken', tb_token);
      }
      if (tb_refresh_token) {
        setTbRefreshToken(tb_refresh_token);
        localStorage.setItem('tbRefreshToken', tb_refresh_token);
      }

      // Fetch user details immediately
      const userRes = await api.get(`/users/me?t=${new Date().getTime()}`, { 
        headers: { 
          Authorization: `Bearer ${access_token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
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

  // Add response interceptor to handle 401s globally
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // If we get a 401, it means the token is invalid (expired or user deleted)
        // We should logout the user to clear the invalid state
        if (token) { // Only if we think we are logged in
            setUser(null);
            setToken(null);
            setTbToken(null);
            setTbRefreshToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('tbToken');
            localStorage.removeItem('tbRefreshToken');
        }
      }
      return Promise.reject(error);
    }
  );

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


  return (
    <AuthContext.Provider value={{ user, setUser, token, tbToken, login, loginTB, logout, updateProfile, loading, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
