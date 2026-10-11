'use client';
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Eye, EyeOff, Lock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, AuthField, SubmitButton } from '@/components/auth/FormBits';

export default function ResetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

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
      const result = await apiFetch('/v1/auth/reset-password', {
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
  /* Strength scores 0–5 but the meter has four segments, so the top tier
     absorbs both 4 and 5. */
  const STRENGTH_TIERS = [
    { fill: 'bg-az-error-500', label: 'text-az-error-500' },
    { fill: 'bg-az-warning-500', label: 'text-az-warning-500' },
    { fill: 'bg-az-success-400', label: 'text-az-success-400' },
    { fill: 'bg-az-success-500', label: 'text-az-success-500' },
  ];
  const tier = STRENGTH_TIERS[Math.min(Math.max(passwordStrength, 1), 4) - 1];
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-az-surface-root)] p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 grid size-18 place-items-center rounded-full bg-gradient-to-br from-az-flame to-az-scarlet shadow-az-glow">
            <Check className="size-9 text-az-ink" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <h2 className="az-headline mb-2 text-2xl text-az-ink">Password Reset Successful!</h2>
          <p className="az-body text-az-ink-muted">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      headlineLines={['Password', 'Reset']}
      tagline="Choose something you'll actually remember."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="az-headline text-3xl text-az-ink">Reset your password</h2>
          <p className="az-body mt-1 text-az-ink-muted">
            Enter a strong new password to secure your account
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        <div>
          <AuthField
            id="new-password"
            name="new-password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            label="New password"
            icon={Lock}
            required
            value={newPassword}
            onChange={handlePasswordChange}
            trailing={
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="px-3 py-1 text-az-ink/80 hover:text-az-ink"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            }
          />

          {/* Password strength bar — 4 segments */}
          {newPassword && (
            <div className="mt-3">
              <div className="mb-1.5 flex gap-1.5">
                {strengthBars.map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= passwordStrength ? tier.fill : 'bg-az-ink/12'
                    }`}
                  />
                ))}
              </div>
              <div className="az-micro-label flex justify-between text-az-ink/40">
                <span>Weak</span>
                <span>Fair</span>
                <span>Good</span>
                <span className={tier.label}>{strengthLabel}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <AuthField
            id="confirm-password"
            name="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            label="Confirm password"
            icon={Lock}
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError(null);
            }}
            trailing={
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="px-3 py-1 text-az-ink/80 hover:text-az-ink"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            }
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="az-caption mt-1 text-az-error-500">Passwords do not match</p>
          )}
        </div>

        <SubmitButton isLoading={isLoading} loadingLabel="Resetting...">
          Reset Password
        </SubmitButton>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="az-body text-az-ink-muted transition-colors hover:text-az-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
