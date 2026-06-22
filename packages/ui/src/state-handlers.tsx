'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
  mode: 'dark' | 'light' | 'system';
  setMode: (mode: 'dark' | 'light' | 'system') => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
      toggleMode: () => {
        const current = get().mode;
        set({ mode: current === 'dark' ? 'light' : 'dark' });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  notifications: { id: string; read: boolean }[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  notifications: [],
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}));

interface UserPreferences {
  language: string;
  setLanguage: (lang: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  autoplayVideos: boolean;
  setAutoplayVideos: (enabled: boolean) => void;
}

export const usePreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      autoplayVideos: true,
      setAutoplayVideos: (enabled) => set({ autoplayVideos: enabled }),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
