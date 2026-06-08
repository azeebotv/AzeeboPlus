import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Button, Card, Spinner } from '@azeebo/ui';
import { colors } from '@azeebo/design-tokens';

export default function RoleSelectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleSelection = async (role: 'user' | 'creator' | 'both') => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, you would send this to your backend to set the user's role
      // For now, we'll just store it locally and navigate to profile setup
      // await api.auth.setRole({ role });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to profile setup
      router.push('/auth/profile-setup');
    } catch (err: any) {
      setError(err.message || 'Failed to select role');
      webLogger.error('Role selection failed', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg.primary }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>
            Select Your Role
          </h1>
          <p className="text-lg text-gray-500 mt-4">
            Are you here to watch content, create content, or both?
          </p>
        </div>

        <div className="space-y-6">
          <Button
            variant="primary"
            onClick={() => handleRoleSelection('user')}
            className="w-full flex items-center justify-between px-6 py-4"
            disabled={isLoading}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b82f620' }}>
                <span className="text-2xl">👀</span>
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: colors.text.primary }}>
                  Viewer
                </h2>
                <p className="text-sm text-gray-500">
                  Watch shows, vote, and enjoy content
                </p>
              </div>
            </div>
            {isLoading && (
              <Spinner size="sm" className="ml-4" />
            )}
          </Button>

          <Button
            variant="primary"
            onClick={() => handleRoleSelection('creator')}
            className="w-full flex items-center justify-between px-6 py-4"
            disabled={isLoading}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b98120' }}>
                <span className="text-2xl">🎥</span>
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: colors.text.primary }}>
                  Creator
                </h2>
                <p className="text-sm text-gray-500">
                  Upload content, engage with fans, and earn
                </p>
              </div>
            </div>
            {isLoading && (
              <Spinner size="sm" className="ml-4" />
            )}
          </Button>

          <Button
            variant="primary"
            onClick={() => handleRoleSelection('both')}
            className="w-full flex items-center justify-between px-6 py-4"
            disabled={isLoading}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8b5cf620' }}>
                <span className="text-2xl">👀🎥</span>
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: colors.text.primary }}>
                  Both
                </h2>
                <p className="text-sm text-gray-500">
                  Watch and create content
                </p>
              </div>
            </div>
            {isLoading && (
              <Spinner size="sm" className="ml-4" />
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}