'use client';
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@azeebo/ui';

// Auth context interface for ProtectedRoute
export interface AuthState {
  user: { role?: string; [key: string]: unknown } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Context to hold auth state - must be provided by a parent AuthProvider
const ProtectedAuthContext = createContext<AuthState | undefined>(undefined);

export function useProtectedAuth(): AuthState {
  const context = useContext(ProtectedAuthContext);
  if (!context) {
    throw new Error('useProtectedAuth must be used within a ProtectedAuthProvider');
  }
  return context;
}

export interface ProtectedAuthProviderProps {
  children: ReactNode;
  value: AuthState;
}

export function ProtectedAuthProvider({ children, value }: ProtectedAuthProviderProps) {
  return <ProtectedAuthContext.Provider value={value}>{children}</ProtectedAuthContext.Provider>;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireCreator?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireCreator = false,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useProtectedAuth();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requireAdmin && user?.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }

    if (requireCreator && user?.role !== 'creator' && user?.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requireAuth,
    requireAdmin,
    requireCreator,
    redirectTo,
    router,
  ]);

  if (isLoading) {
    return <LoadingState title="Checking authorization..." />;
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return null;
  }

  if (requireCreator && user?.role !== 'creator' && user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
