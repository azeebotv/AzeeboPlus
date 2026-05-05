import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';
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
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { getItem, setItem, removeItem } = useStorage();

  useEffect(() => {
    if (isAuthenticated) {
      getSettings();
    }
  }, [isAuthenticated]);

  const getSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserSettings>('/user/settings');
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
      const response = await apiClient.put<UserSettings>('/user/settings', newSettings);
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
      const response = await apiClient.put<UserSettings>('/user/profile', profile);
      setSettings(response);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/user/change-password', { currentPassword, newPassword });
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/user/delete-account');
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