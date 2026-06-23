'use client';
import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/auth/FormBits';

export default function ResetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [success, setSuccess] = useState<boolean>(false);

  const calculateStrength = useCallback((password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(calculateStrength(value));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordStrength < 3) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to reset password');
      }
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An error occurred during password reset';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const strengthBars = [1, 2, 3, 4];
  const strengthColor =
    passwordStrength <= 1
      ? '#ef4444'
      : passwordStrength === 2
        ? '#f59e0b'
        : passwordStrength === 3
          ? '#84cc16'
          : '#22c55e';
  const strengthLabel =
    passwordStrength <= 1
      ? 'Weak'
      : passwordStrength === 2
        ? 'Fair'
        : passwordStrength === 3
          ? 'Good'
          : 'Strong';

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: '#1A0A0A' }}
      >
        <div className="text-center max-w-md">
          <div
            className="mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
              boxShadow: '0 0 30px rgba(204,28,28,0.5)',
            }}
          >
            <svg
              className="h-9 w-9 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="az-headline text-white text-2xl mb-2">Password Reset Successful!</h2>
          <p className="text-white/55">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell headlineLines={['Password', 'Reset']} backgroundFallback="#1A0A0A">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="az-headline text-white text-3xl">Reset your password</h2>
          <p className="text-white/55 text-sm mt-1">
            Enter a strong new password to secure your account
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        <div>
          <label htmlFor="current" className="az-label">
            Current password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </span>
            <input
              id="current"
              type="password"
              className="az-input"
              style={{ paddingLeft: '2.5rem' }}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className="az-label">
            New password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </span>
            <input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              className="az-input"
              style={{ paddingLeft: '2.5rem', paddingRight: '3.5rem' }}
              value={newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-white/50 hover:text-white"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Password strength bar — 4 segments */}
          {newPassword && (
            <div className="mt-3">
              <div className="flex gap-1.5 mb-1.5">
                {strengthBars.map((level) => (
                  <div
                    key={level}
                    className="h-1.5 flex-1 rounded-full transition-colors"
                    style={{
                      background:
                        level <= passwordStrength ? strengthColor : 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-wider">
                <span>Weak</span>
                <span>Fair</span>
                <span>Good</span>
                <span style={{ color: newPassword ? strengthColor : undefined }}>
                  {strengthLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password" className="az-label">
            Confirm password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </span>
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              className="az-input"
              style={{ paddingLeft: '2.5rem', paddingRight: '3.5rem' }}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-white/50 hover:text-white"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1 text-xs" style={{ color: '#CC1C1C' }}>
              Passwords do not match
            </p>
          )}
        </div>

        <button type="submit" className="az-btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Resetting...
            </span>
          ) : (
            'Send Recovery Link'
          )}
        </button>

        <div className="text-center">
          <a
            href="/auth/login"
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </AuthShell>
  );
}
