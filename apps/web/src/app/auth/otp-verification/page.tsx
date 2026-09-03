import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth Otp-verification  - Azeebo+',
  description: 'Auth Otp-verification  on Azeebo+',
};

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/auth/BrandLogo';
import { Alert, Spinner } from '@/components/auth/FormBits';
import { apiFetch } from '@/lib/api';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OTPVerificationPage(): React.JSX.Element {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resendIn, setResendIn] = useState<number>(RESEND_SECONDS);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return (): void => clearInterval(t);
  }, [resendIn]);

  const handleChange = (index: number, value: string): void => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }
    const next = [...digits];
    // Handle paste of multiple digits
    if (clean.length > 1) {
      const chars = clean.slice(0, OTP_LENGTH - index).split('');
      chars.forEach((c, i) => {
        next[index + i] = c;
      });
      setDigits(next);
      const focusIdx = Math.min(index + chars.length, OTP_LENGTH - 1);
      inputsRef.current[focusIdx]?.focus();
      return;
    }
    next[index] = clean;
    setDigits(next);
    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const result = await apiFetch('/v1/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (!result.success) {
        throw new Error(result.message || 'Invalid verification code');
      }
      router.push('/auth/role-selection');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    if (resendIn > 0) return;
    try {
      await apiFetch('/v1/auth/resend-otp', { method: 'POST' });
    } catch {
      // Resend failed silently — user can try again after timer
    }
    setResendIn(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputsRef.current[0]?.focus();
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden"
      style={{ backgroundColor: 'var(--brand-near-black)' }}
    >
      {/* Subtle abstract tech pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M30 5l5 5-5 5-5-5z'/%3E%3Ccircle cx='10' cy='40' r='3'/%3E%3Cpath d='M45 35h10M45 40h10M45 45h10'/%3E%3Cpath d='M5 55h15'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      {/* Logo top-left */}
      <div className="absolute top-0 left-0 p-8 z-20">
        <BrandLogo variant="light" />
      </div>

      {/* Right-edge red ambient glow */}
      <div
        className="az-ambient-red"
        style={{ width: 500, height: 500, top: '50%', right: -200, transform: 'translateY(-50%)' }}
      />

      <div className="az-glass az-glass--glow relative z-10 w-full max-w-xl p-8 sm:p-10 text-center">
        <h1 className="az-headline text-white text-3xl mb-3">Verify Your Identity</h1>
        <p className="text-white/55 text-sm leading-relaxed mb-8">
          Enter your 6 digits verification code sent to your phone number
        </p>

        {error && (
          <div className="mb-6 text-left">
            <Alert>{error}</Alert>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-7">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Digit ${i + 1}`}
                className="az-input text-center font-bold text-xl"
                style={{ width: 48, height: 56, padding: 0 }}
              />
            ))}
          </div>

          <p className="text-white/50 text-sm">
            Don&apos;t receive the code.{' '}
            {resendIn > 0 ? (
              <span className="font-bold text-white">Resend in {resendIn}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-bold text-white hover:text-[var(--brand-orange)] underline"
              >
                Resend
              </button>
            )}
          </p>

          <button
            type="submit"
            className="az-btn-primary"
            style={{
              width: 'auto',
              marginInline: 'auto',
              paddingInline: '3rem',
              display: 'inline-block',
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Verifying...
              </span>
            ) : (
              'Verify and continue'
            )}
          </button>

          <p className="text-white/40 text-xs">Encrypted &amp; Secure Verification</p>
        </form>
      </div>
    </div>
  );
}
