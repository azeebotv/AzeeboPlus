'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/auth/FormBits';

export default function LoginPage(): JSX.Element {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await login(phone, password);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.message || 'Invalid phone number or password');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      headlineLines={['Explore Nigerian', 'Entertainment', 'Like Never Before']}
      backgroundFallback="#1A0A0A"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="az-headline text-white text-3xl">Welcome</h2>
        </div>

        {error && <Alert>{error}</Alert>}

        <div>
          <label htmlFor="phone" className="az-label">
            Phone Number
          </label>
          <div className="relative flex items-center">
            <span
              className="absolute left-3 flex items-center gap-1 text-white text-sm font-medium"
              aria-hidden="true"
            >
              🇳🇬 <span className="text-white/70">+234</span>
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="az-input"
              style={{ paddingLeft: '5.5rem' }}
              placeholder="801 234 5678"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="az-label">
            Enter your password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="az-input"
              style={{ paddingRight: '3.5rem' }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-white/50 hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/auth/forgot-password"
            className="text-white/50 hover:text-white text-xs transition-colors"
          >
            Forgot your password?
          </a>
        </div>

        <button type="submit" className="az-btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Logging in...
            </span>
          ) : (
            'Login to Azeebo+'
          )}
        </button>

        <div className="az-divider">Or continue with</div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="az-btn-social az-btn-social--light">
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
          <button type="button" className="az-btn-social az-btn-social--dark">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>

        <p className="text-center text-white/50 text-sm pt-2">
          Don&apos;t have an account.{' '}
          <a
            href="/auth/register"
            className="font-bold text-white hover:text-[#E8420A] transition-colors"
          >
            Sign up!
          </a>
        </p>
      </form>
    </AuthShell>
  );
}
