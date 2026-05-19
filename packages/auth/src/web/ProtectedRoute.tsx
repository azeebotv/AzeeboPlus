'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@azeebo/ui';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // TODO: Replace with actual auth check
      // For now, simulate a check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock: Check if user is logged in
      const mockUser = localStorage.getItem('azeebo_user');
      const isAuthenticated = !!mockUser;
      
      if (!isAuthenticated && requireAuth) {
        router.push(redirectTo);
        return;
      }

      if (requireAdmin || requireCreator) {
        // Mock admin/creator check
        const userData = mockUser ? JSON.parse(mockUser) : null;
        const hasRole = requireAdmin ? userData?.role === 'admin' : userData?.role === 'creator';
        
        if (!hasRole) {
          router.push('/unauthorized');
          return;
        }
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [requireAuth, requireAdmin, requireCreator, redirectTo, router]);

  if (isLoading) {
    return <LoadingState title="Checking authorization..." />;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
