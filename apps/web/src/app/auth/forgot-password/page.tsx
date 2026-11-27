'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import BrandLogo from '@/components/auth/BrandLogo';
import { Alert, Spinner } from '@/components/auth/FormBits';

const FORGOT_PASSWORD_TIMEOUT_MS = parseInt(process.env.FORGOT_PASSWORD_TIMEOUT_MS || '3000', 10);

export default function ForgotPasswordPage(): React.JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const response = await api.auth.requestPasswordReset(email);
      if (response.success) {
        setSuccess('Password reset email sent successfully');
        setEmail('');
        setTimeout(() => router.push('/auth/login'), FORGOT_PASSWORD_TIMEOUT_MS);
      } else {
        setError(response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      webLogger.error('Forgot password request failed', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-az-surface-root">
      {/* Logo top-left */}
      <div className="absolute top-0 left-0 p-8 z-20">
        <BrandLogo variant="light" />
      </div>

      {/* Left: glowing padlock illustration section (~55%) */}
      <div className="relative hidden lg:flex w-[55%] items-center justify-center">
        {/* Circuit / glow backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--color-az-scarlet) 18%, transparent), transparent 55%), radial-gradient(circle at 50% 80%, color-mix(in srgb, var(--color-az-scarlet) 25%, transparent), transparent 60%)',
          }}
        />
        {/* 3D padlock visual (CSS) */}
        <div className="relative h-[280px] w-[220px]">
          {/* Electric arc glow */}
          <div
            className="absolute inset-0 blur-[50px]"
            style={{
              background:
                'radial-gradient(circle, color-mix(in srgb, var(--color-az-scarlet) 60%, transparent), transparent 70%)',
            }}
          />
          {/* Shackle */}
          <div className="absolute top-0 left-1/2 h-[110px] w-[110px] -translate-x-1/2 rounded-t-[55px] border-[18px] border-t-az-flame border-b-transparent border-x-transparent shadow-az-glow" />
          {/* Lock body */}
          <div className="absolute top-[95px] left-1/2 flex h-[160px] w-[180px] -translate-x-1/2 items-center justify-center rounded-az-panel border-2 border-az-scarlet/50 bg-[var(--auth-warm-gradient)] shadow-az-glow">
            {/* Keyhole */}
            <div className="size-[28px] rounded-full bg-[radial-gradient(circle,var(--color-az-warning-400),var(--color-az-flame))] shadow-az-glow" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 p-10 xl:p-14">
          <h1 className="az-display text-az-ink xl:az-hero">
            <span className="block">Password</span>
            <span className="block">Recovery</span>
          </h1>
        </div>
      </div>

      {/* Right: glass card (~45%) */}
      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        {/* Ambient red glow bottom-right */}
        <div className="az-ambient-red size-[400px] -bottom-[120px] -right-[120px]" />

        <div className="az-glass az-glass--glow relative z-10 w-full max-w-md p-8 text-center">
          {/* Shield/lock icon badge */}
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-az-control border border-az-scarlet/40 bg-az-scarlet/15">
            <Lock size={32} className="text-az-ink" aria-hidden />
          </div>

          <p className="az-body mb-6 leading-relaxed text-az-ink-muted">
            Enter your email and we will send you a link to reset your password
          </p>

          {error && (
            <div className="mb-5 text-left">
              <Alert>{error}</Alert>
            </div>
          )}
          {success && (
            <div className="mb-5 text-left">
              <Alert variant="success">{success}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label htmlFor="email" className="az-label">
                Registered Email / Username
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="az-input"
                placeholder="e.g. williams@azeeboplus.com"
              />
            </div>

            <button type="submit" className="az-btn-primary" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Sending...
                </span>
              ) : (
                'Send Recovery Link'
              )}
            </button>
          </form>

          <div className="az-body mt-6 flex items-center justify-center gap-3 text-az-ink-muted">
            <Link href="/auth/login" className="transition-colors hover:text-az-ink">
              Back to login
            </Link>
            <span aria-hidden>·</span>
            <Link href="/support" className="transition-colors hover:text-az-ink">
              Need Support?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
