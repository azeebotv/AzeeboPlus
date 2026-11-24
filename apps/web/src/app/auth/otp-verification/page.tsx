'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
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
    <AuthShell
      headlineLines={['Security', 'is a habit']}
      tagline="A one-time code keeps your Azeebo+ account yours alone."
    >
      <div className="text-center">
        <h2 className="az-headline text-2xl text-az-ink">Verify Your Identity</h2>
        <p className="az-body mx-auto mt-2 max-w-sm leading-relaxed text-az-ink-muted">
          Enter your 6 digits verification code sent to your phone number
        </p>
      </div>

      {error && (
        <div className="mt-5 text-left">
          <Alert>{error}</Alert>
        </div>
      )}

      <form onSubmit={handleVerify} className="mt-7 space-y-7">
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
              className="az-input az-input--otp"
            />
          ))}
        </div>

        <p className="az-body text-az-ink-muted">
          Don&apos;t receive the code.{' '}
          {resendIn > 0 ? (
            <span className="font-bold text-az-ink">Resend in {resendIn}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-bold text-az-ink hover:text-az-flame underline"
            >
              Resend
            </button>
          )}
        </p>

        <div className="flex justify-center">
          <button
            type="submit"
            className="az-btn-primary az-btn-primary--inline"
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
        </div>

        <p className="az-caption text-az-ink-muted">Encrypted &amp; Secure Verification</p>
      </form>
    </AuthShell>
  );
}
