import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isBiometricAvailable: boolean;
  savedEmail: string | null;
  biometricEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  logout: (clearSaved?: boolean) => Promise<void>;
  setBiometricEnabled: (enabled: boolean, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KEY_TOKEN = 'api_token';
const KEY_USER = 'user';
const KEY_EMAIL = 'saved_email';
const KEY_BIOMETRIC = 'biometric_enabled';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setIsBiometricAvailable(
        biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ||
          biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) ||
          biometricTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
      );

      const biometricFlag = await SecureStore.getItemAsync(KEY_BIOMETRIC);
      const email = await SecureStore.getItemAsync(KEY_EMAIL);
      setSavedEmail(email);
      setBiometricEnabledState(biometricFlag === '1');

      const token = await SecureStore.getItemAsync(KEY_TOKEN);
      const userStr = await SecureStore.getItemAsync(KEY_USER);
      if (token && userStr) {
        setUser(JSON.parse(userStr));
        try {
          const freshUser = await api.getUser();
          setUser(freshUser);
          await SecureStore.setItemAsync(KEY_USER, JSON.stringify(freshUser));
        } catch {
          await SecureStore.deleteItemAsync(KEY_TOKEN);
          await SecureStore.deleteItemAsync(KEY_USER);
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, saveCredentials = true) => {
    const data = await api.login(email, password);
    await SecureStore.setItemAsync(KEY_TOKEN, data.token);
    await SecureStore.setItemAsync(KEY_USER, JSON.stringify(data.user));
    if (saveCredentials) {
      await SecureStore.setItemAsync(KEY_EMAIL, email);
      setSavedEmail(email);
    }
    setUser(data.user);
  };

  const loginWithBiometric = async (): Promise<boolean> => {
    try {
      const email = await SecureStore.getItemAsync(KEY_EMAIL);
      if (!email) return false;

      const biometricFlag = await SecureStore.getItemAsync(KEY_BIOMETRIC);
      if (biometricFlag !== '1') return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticarse para acceder',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (!result.success) return false;

      const token = await SecureStore.getItemAsync(KEY_TOKEN);
      const userStr = await SecureStore.getItemAsync(KEY_USER);
      if (!token || !userStr) return false;

      try {
        const freshUser = await api.getUser();
        setUser(freshUser);
        await SecureStore.setItemAsync(KEY_USER, JSON.stringify(freshUser));
      } catch {
        setUser(JSON.parse(userStr));
      }
      return true;
    } catch {
      return false;
    }
  };

  const logout = async (clearSaved = false) => {
    try {
      await api.logout();
    } catch {}
    await SecureStore.deleteItemAsync(KEY_TOKEN);
    await SecureStore.deleteItemAsync(KEY_USER);
    if (clearSaved) {
      await SecureStore.deleteItemAsync(KEY_EMAIL);
      await SecureStore.deleteItemAsync(KEY_BIOMETRIC);
      setSavedEmail(null);
      setBiometricEnabledState(false);
    }
    setUser(null);
  };

  const setBiometricEnabled = async (enabled: boolean, email: string) => {
    if (enabled) {
      await SecureStore.setItemAsync(KEY_BIOMETRIC, '1');
      await SecureStore.setItemAsync(KEY_EMAIL, email);
      setSavedEmail(email);
    } else {
      await SecureStore.deleteItemAsync(KEY_BIOMETRIC);
      await SecureStore.deleteItemAsync(KEY_EMAIL);
      setSavedEmail(null);
    }
    setBiometricEnabledState(enabled);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isBiometricAvailable,
        savedEmail,
        biometricEnabled,
        login,
        loginWithBiometric,
        logout,
        setBiometricEnabled,
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