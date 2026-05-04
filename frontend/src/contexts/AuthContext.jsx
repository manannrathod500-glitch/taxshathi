import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('taxsaathi_token');

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('taxsaathi_token')}` }
  });

  const fetchMe = useCallback(async () => {
    const t = localStorage.getItem('taxsaathi_token');
    if (!t) { setLoading(false); return; }
    try {
      const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
      setUser(res.data);
    } catch {
      localStorage.removeItem('taxsaathi_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('taxsaathi_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, phone, password, referralCode) => {
    const res = await axios.post(`${API}/auth/register`, {
      name, email, phone, password, referral_code: referralCode || null
    });
    localStorage.setItem('taxsaathi_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('taxsaathi_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, authHeaders());
      setUser(res.data);
      return res.data;
    } catch { logout(); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, refreshUser, API, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
