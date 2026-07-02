import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { useStorage } from '../hooks/useStorage';

interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  account: {
    email: string;
    phone: string;
    displayName: string;
    avatar: string;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showActivity: boolean;
    allowMessages: boolean;
  };
}

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  getSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateProfile: (profile: Partial<UserSettings['account']>) => Promise<void>;
  changePassword: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { getItem: _getItem, setItem: _setItem, removeItem: _removeItem } = useStorage();

  useEffect(() => {
    if (isAuthenticated) {
      getSettings();
    }
  }, [isAuthenticated]);

  const getSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserSettings>('/v1/users/me/preferences');
      setSettings(response);
    } catch (error: any) {
      setError(error.message || 'Failed to get settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.put<UserSettings>('/v1/users/me/preferences', newSettings);
      setSettings(response);
    } catch (error: any) {
      setError(error.message || 'Failed to update settings');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profile: Partial<UserSettings['account']>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.put<UserSettings>('/v1/users/me', profile);
      setSettings(response);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/v1/auth/forgot-password', { email: user?.email });
      Alert.alert('Check your email', 'A password reset link has been sent to your email address.');
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.delete('/v1/user/delete-account');
      await logout();
    } catch (error: any) {
      setError(error.message || 'Failed to delete account');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        getSettings,
        updateSettings,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
