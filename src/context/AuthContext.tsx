import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.setUnauthorizedHandler(() => setUser(null));
    checkAuth();
    return () => api.setUnauthorizedHandler(null);
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('api_token');
      const userStr = await SecureStore.getItemAsync('user');
      if (token && userStr) {
        setUser(JSON.parse(userStr));
        try {
          const freshUser = await api.getUser();
          setUser(freshUser);
          await SecureStore.setItemAsync('user', JSON.stringify(freshUser));
        } catch {
          await SecureStore.deleteItemAsync('api_token');
          await SecureStore.deleteItemAsync('user');
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    // La app es solo para administradores: la API rechazaría todo lo demás con 403.
    if (!data.user?.is_admin) {
      await api.logout().catch(() => undefined);
      throw { response: { data: { message: 'Tu usuario no tiene permisos de administrador.' } } };
    }
    setUser(data.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
