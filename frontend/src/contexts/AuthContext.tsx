import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { Usuario, AuthResponse } from '../types';

interface AuthContextType {
  user: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Verify token and get user data
      api.get('/auth/me')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, user } = response.data;
    
    localStorage.setItem('access_token', access_token);
    setUser(user);
  };

  const register = async (userData: RegisterData) => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    const { access_token, user } = response.data;
    
    localStorage.setItem('access_token', access_token);
    setUser(user);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {
      // Even if logout fails on server, clear local state
    });
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};