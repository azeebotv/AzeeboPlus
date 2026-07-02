'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div
      className="relative min-h-screen w-full flex overflow-hidden"
      style={{ backgroundColor: '#1A0A0A' }}
    >
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
              'radial-gradient(circle at 50% 45%, rgba(232,66,10,0.18), transparent 55%), radial-gradient(circle at 50% 80%, rgba(204,28,28,0.25), transparent 60%)',
          }}
        />
        {/* 3D padlock visual (CSS) */}
        <div className="relative" style={{ width: 220, height: 280 }}>
          {/* Electric arc glow */}
          <div
            className="absolute inset-0"
            style={{
              filter: 'blur(50px)',
              background: 'radial-gradient(circle, rgba(204,28,28,0.6), transparent 70%)',
            }}
          />
          {/* Shackle */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 0,
              width: 110,
              height: 110,
              borderRadius: '55px 55px 0 0',
              border: '18px solid',
              borderColor: '#E8420A transparent transparent transparent',
              boxShadow: '0 0 25px rgba(232,66,10,0.6)',
            }}
          />
          {/* Lock body */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-2xl flex items-center justify-center"
            style={{
              top: 95,
              width: 180,
              height: 160,
              background: 'linear-gradient(160deg, #3a1a0a, #1A0A0A)',
              border: '2px solid rgba(232,66,10,0.5)',
              boxShadow: '0 0 40px rgba(204,28,28,0.4)',
            }}
          >
            {/* Keyhole */}
            <div
              className="rounded-full"
              style={{
                width: 28,
                height: 28,
                background: 'radial-gradient(circle, #fbbf24, #E8420A)',
                boxShadow: '0 0 20px rgba(251,191,36,0.8)',
              }}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 p-10 xl:p-14">
          <h1 className="az-headline text-white text-5xl xl:text-6xl">
            <span className="block">Password</span>
            <span className="block">Recovery</span>
          </h1>
        </div>
      </div>

      {/* Right: glass card (~45%) */}
      <div className="relative flex-1 flex items-center justify-center p-6 sm:p-10">
        {/* Ambient red glow bottom-right */}
        <div
          className="az-ambient-red"
          style={{ width: 400, height: 400, bottom: -120, right: -120 }}
        />

        <div className="az-glass az-glass--glow relative z-10 w-full max-w-md p-8 text-center">
          {/* Shield/lock icon badge */}
          <div
            className="mx-auto mb-6 flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(204,28,28,0.15)',
              border: '1px solid rgba(204,28,28,0.4)',
            }}
          >
            <svg className="h-8 w-8" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <p className="text-white text-sm leading-relaxed mb-6">
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

          <div className="mt-6 flex items-center justify-center gap-3 text-white/50 text-sm">
            <a href="/auth/login" className="hover:text-white transition-colors">
              Back to login
            </a>
            <span>·</span>
            <a href="/support" className="hover:text-white transition-colors">
              Need Support?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
