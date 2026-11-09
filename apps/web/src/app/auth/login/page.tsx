'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, AuthField, Spinner } from '@/components/auth/FormBits';
import { isAbsoluteTarget, safeRedirectTarget } from '@/lib/first-party-redirect';
import { socialAuthErrorMessage } from '@/lib/social-auth-errors';
import { useFlags } from '@/context/FlagsContext';
import {
  SOCIAL_PROVIDER_FLAGS,
  socialAuthorizeUrl,
  type SocialProvider,
} from '@/lib/social-authorize';

const formVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function LoginPage(): React.JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Which provider the browser is being handed off to, so the button can show
  // progress and lock the form while the navigation is in flight.
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);
  const { login } = useAuth();
  const { isEnabled } = useFlags();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Panels outside this origin hand their users here to sign in, so the target
  // may be a first-party absolute URL; anything else falls back to /home.
  const redirectTo = safeRedirectTarget(searchParams.get('redirect'));
  // A failed provider round trip returns here with a mapped code rather than
  // raw JSON; it surfaces through the same Alert as a bad password.
  const [error, setError] = useState<string | null>(() =>
    socialAuthErrorMessage(searchParams.get('error'))
  );

  // A provider is offered only when its kill switch is on. Fails closed by
  // design: the flag store returns false until bootstrap resolves, so a
  // gateway outage hides the buttons rather than exposing a dead path.
  const providerEnabled: Record<SocialProvider, boolean> = {
    google: isEnabled(SOCIAL_PROVIDER_FLAGS.google),
    apple: isEnabled(SOCIAL_PROVIDER_FLAGS.apple),
  };
  const enabledProviders = (['google', 'apple'] as const).filter((p) => providerEnabled[p]);
  const isBusy = isLoading || pendingProvider !== null;

  const startProvider = (provider: SocialProvider): void => {
    if (isBusy) return;
    setError(null);
    setPendingProvider(provider);
    // Full navigation, not router.push: the authorize endpoint answers with a
    // 302 to the provider, which the App Router cannot render.
    window.location.assign(socialAuthorizeUrl(provider, redirectTo));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (isAbsoluteTarget(redirectTo)) {
          window.location.assign(redirectTo);
          return;
        }
        router.push(redirectTo);
      } else {
        setError(result.message || 'Invalid email or password');
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
      tagline="Movies. Series. Live sport. Music. All in one place."
    >
      <motion.form
        className="space-y-5"
        onSubmit={handleSubmit}
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fieldVariants}>
          <h2 className="az-display text-az-ink">Welcome Back</h2>
          <p className="az-lead mt-2 text-az-ink/65">Log in to continue your journey on Azeebo+</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert>{error}</Alert>
          </motion.div>
        )}

        <motion.div variants={fieldVariants}>
          <AuthField
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            label="Email or phone number"
            icon={Mail}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <AuthField
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            label="Password"
            icon={Lock}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="px-3 py-1 text-az-ink/80 hover:text-az-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="flex items-center justify-end">
          <a
            href="/auth/forgot-password"
            className="az-body-strong text-az-ink/80 transition-colors hover:text-az-ink"
          >
            Forgot password?
          </a>
        </motion.div>

        <motion.div variants={fieldVariants}>
          <motion.button
            type="submit"
            className="az-btn-primary flex items-center justify-center gap-2"
            disabled={isLoading}
            whileHover={isLoading ? {} : { scale: 1.02 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {isLoading ? (
              <>
                <Spinner /> Logging in...
              </>
            ) : (
              <>
                Log in <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </>
            )}
          </motion.button>
        </motion.div>

        {enabledProviders.length > 0 && (
          <motion.div variants={fieldVariants} className="az-divider">
            or
          </motion.div>
        )}

        {enabledProviders.length > 0 && (
          <motion.div
            variants={fieldVariants}
            className={`grid gap-3 ${enabledProviders.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
            data-social-providers
          >
            {providerEnabled.google && (
              <motion.button
                type="button"
                className="az-btn-social"
                aria-label={
                  pendingProvider === 'google' ? 'Redirecting to Google…' : 'Continue with Google'
                }
                aria-busy={pendingProvider === 'google' ? 'true' : undefined}
                disabled={isBusy}
                onClick={() => startProvider('google')}
              >
                {pendingProvider === 'google' ? (
                  <Spinner />
                ) : (
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
                )}
              </motion.button>
            )}

            {providerEnabled.apple && (
              <motion.button
                type="button"
                className="az-btn-social"
                aria-label={
                  pendingProvider === 'apple' ? 'Redirecting to Apple…' : 'Continue with Apple'
                }
                aria-busy={pendingProvider === 'apple' ? 'true' : undefined}
                disabled={isBusy}
                onClick={() => startProvider('apple')}
              >
                {pendingProvider === 'apple' ? (
                  <Spinner />
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
              </motion.button>
            )}
          </motion.div>
        )}

        <motion.p variants={fieldVariants} className="az-body pt-2 text-center text-az-ink/70">
          Don&apos;t have an account yet?{' '}
          <a
            href="/auth/register"
            className="az-body-strong az-text-gradient transition-opacity hover:opacity-85"
          >
            Register for free
          </a>
        </motion.p>
      </motion.form>
    </AuthShell>
  );
}
