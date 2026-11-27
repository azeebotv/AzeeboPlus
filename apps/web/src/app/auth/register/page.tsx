'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, Spinner } from '@/components/auth/FormBits';

const formVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
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

export default function RegisterPage(): React.JSX.Element {
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

    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
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
      tagline="Create, publish and get paid — from anywhere in Nigeria."
    >
      <motion.form
        className="space-y-5"
        onSubmit={handleSubmit}
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fieldVariants}>
          <h2 className="az-headline text-az-ink text-2xl">Create Your Azeebo+ Account</h2>
          <motion.p
            className="az-overline mt-1 text-az-flame"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Step 1: Your Details
          </motion.p>
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
        </motion.div>

        <motion.div variants={fieldVariants}>
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
        </motion.div>

        <motion.div variants={fieldVariants}>
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
              className="az-input az-input--trailing"
              placeholder="Create a strong password"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-az-ink-muted hover:text-az-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </motion.button>
          </div>
        </motion.div>

        <motion.label variants={fieldVariants} className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-az-scarlet"
          />
          <span className="az-caption text-az-ink-muted">
            I agree to the{' '}
            <a href="/terms" className="text-az-ink hover:text-az-flame underline">
              terms of services
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-az-ink hover:text-az-flame underline">
              privacy policy
            </a>
          </span>
        </motion.label>

        {/* Ambient red glow at bottom of card */}
        <div className="az-ambient-red az-glow-drift -bottom-[50px] left-1/2 h-[120px] w-[250px] -translate-x-1/2" />

        <motion.div variants={fieldVariants} className="relative z-10">
          <motion.button
            type="submit"
            className="az-btn-primary"
            disabled={isLoading}
            whileHover={isLoading ? {} : { scale: 1.02 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Creating account...
              </span>
            ) : (
              'Continue'
            )}
          </motion.button>
        </motion.div>

        <motion.p variants={fieldVariants} className="az-body pt-1 text-center text-az-ink-muted">
          Already have an account.{' '}
          <a
            href="/auth/login"
            className="font-bold text-az-ink hover:text-az-flame transition-colors"
          >
            Sign in.
          </a>
        </motion.p>
      </motion.form>
    </AuthShell>
  );
}
