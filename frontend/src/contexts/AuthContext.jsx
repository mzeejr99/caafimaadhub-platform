import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('caafimaad_token') || null;
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('caafimaad_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(!user && !!token);

  const fetchCurrentUser = async (authToken) => {
    if (!authToken) {
      setUser(null);
      localStorage.removeItem('caafimaad_user');
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/auth/me');
      if (data && data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('caafimaad_user', JSON.stringify(data.data));
      }
    } catch (err) {
      console.error('[AuthContext] Fetch user error:', err);
      // Only logout if 401 Unauthorized from server
      if (err.status === 401) {
        logout();
      }
      // If offline or network error, preserve cached user so PWA works seamlessly offline!
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (!data || !data.data) {
      throw new Error('Invalid login response from server');
    }

    const { accessToken, refreshToken, user: userData } = data.data;
    localStorage.setItem('caafimaad_token', accessToken);
    localStorage.setItem('caafimaad_user', JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem('caafimaad_refresh_token', refreshToken);
    }
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const registerVolunteer = async (payload) => {
    const data = await api.post('/auth/register', payload);
    return data.data;
  };

  const registerPublicUser = async (payload) => {
    const data = await api.post('/auth/register-public', payload);
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem('caafimaad_token');
    localStorage.removeItem('caafimaad_refresh_token');
    localStorage.removeItem('caafimaad_user');
    setToken(null);
    setUser(null);
  };

  // Quick switch role helper for easy testing / evaluation
  const quickSwitchRole = async (targetRole) => {
    let email = 'superadmin@example.com';
    if (targetRole === 'ADMIN') email = 'admin@example.com';
    if (targetRole === 'VOLUNTEER') email = 'volunteer@example.com';
    if (targetRole === 'PUBLIC_USER') {
      logout();
      return;
    }
    return await login(email, 'Password123!');
  };

  const updateUser = (updatedData) => {
    if (!updatedData) return;
    setUser(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const roleUpper = (user?.role || '').toUpperCase();
  const rolesUpper = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toUpperCase()) : [];
  const isSuper = roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPERADMIN' || rolesUpper.includes('SUPER_ADMIN');
  const isAdminUser = isSuper || roleUpper === 'ADMIN' || rolesUpper.includes('ADMIN');
  const isAnalystUser = roleUpper === 'DATA_ANALYST' || roleUpper === 'DATAANALYST' || roleUpper === 'ANALYST' || rolesUpper.includes('DATA_ANALYST');
  const isVolUser = roleUpper === 'VOLUNTEER' || rolesUpper.includes('VOLUNTEER');
  const isPubUser = roleUpper === 'PUBLIC_USER' || roleUpper === 'PUBLIC' || rolesUpper.includes('PUBLIC_USER');

  const hasPermission = (permissionCode) => {
    if (!user) return false;
    if (isSuper) return true;
    return user.permissions && user.permissions.includes(permissionCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerVolunteer,
        registerPublicUser,
        updateUser,
        refreshUser,
        logout,
        quickSwitchRole,
        hasPermission,
        isAuthenticated: !!user,
        isSuperAdmin: isSuper,
        isAdmin: isAdminUser,
        isOperational: isSuper || isAdminUser,
        isAnalyst: isAnalystUser,
        isVolunteer: isVolUser,
        isPublicUser: isPubUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
