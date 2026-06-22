'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function EditProfilePage(): JSX.Element {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState<string>(user?.displayName || user?.name || '');
  const [bio, setBio] = useState<string>('');
  const [avatar, setAvatar] = useState<string>(user?.avatar || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (displayName.length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiFetch('/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
          avatar: avatar.trim() || undefined,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }

      await refreshUser?.();
      setSuccess('Profile updated successfully!');

      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An error occurred while updating profile';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Image size must be less than 50MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-card p-6 rounded-lg border border-border"
        >
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-500">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center border-2 border-primary">
                  <span className="text-white text-3xl font-bold">
                    {displayName.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground">Profile Photo</h3>
              <p className="text-sm text-muted-foreground">JPG, PNG or WebP. Max 50MB</p>
            </div>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (error) setError(null);
              }}
              className="appearance-none block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Enter your display name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              value={user?.email || ''}
              disabled
              className="appearance-none block w-full px-3 py-2 border border-border bg-muted text-muted-foreground rounded-md sm:text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Tell us about yourself..."
              maxLength={200}
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">{bio.length}/200</p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 flex justify-center py-2 px-4 border border-border text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
