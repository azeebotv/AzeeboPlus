'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/auth/FormBits';

export default function RegisterPage(): JSX.Element {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agree, setAgree] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!agree) {
      setError('Please agree to the terms of service and privacy policy');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(name, email, password);
      if (result.success) {
        router.push('/auth/role-selection');
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch {
      setError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      headlineLines={['Empowering', "Nigeria's Creative", 'Renaissance']}
      backgroundFallback="#1A0A0A"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="az-headline text-white text-2xl">Create Your Azeebo+ Account</h2>
          <p
            className="text-xs font-bold uppercase tracking-widest mt-1"
            style={{ color: '#E8420A' }}
          >
            Step 1: Your Details
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        <div>
          <label htmlFor="name" className="az-label">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="az-input"
            placeholder="Adebayo Williams"
          />
        </div>

        <div>
          <label htmlFor="email" className="az-label">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="az-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="az-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="az-input"
              style={{ paddingRight: '3.5rem' }}
              placeholder="Create a strong password"
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

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded"
            style={{ accentColor: '#CC1C1C' }}
          />
          <span className="text-white/60 text-xs leading-relaxed">
            I agree to the{' '}
            <a href="#" className="text-white hover:text-[#E8420A] underline">
              terms of services
            </a>{' '}
            and{' '}
            <a href="#" className="text-white hover:text-[#E8420A] underline">
              privacy policy
            </a>
          </span>
        </label>

        {/* Ambient red glow emanating from bottom of card */}
        <div
          className="az-ambient-red"
          style={{
            width: 300,
            height: 150,
            bottom: -60,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />

        <button type="submit" className="az-btn-primary relative z-10" disabled={isLoading}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Creating account...
            </span>
          ) : (
            'Continue'
          )}
        </button>

        <p className="text-center text-white/50 text-sm pt-1">
          Already have an account.{' '}
          <a
            href="/auth/login"
            className="font-bold text-white hover:text-[#E8420A] transition-colors"
          >
            Sign in.
          </a>
        </p>
      </form>
    </AuthShell>
  );
}
