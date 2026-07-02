'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';

interface LoginPromptProps {
  siteName: string;
  onLogin: () => void;
  onGoHome: () => void;
}

/**
 * Displayed when a guest user navigates to /home directly.
 * Shows a friendly prompt to log in or go to the legacy homepage.
 */
export default function LoginPrompt({
  siteName,
  onLogin,
  onGoHome,
}: LoginPromptProps): React.JSX.Element {
  return (
    <div className="min-h-screen az-nollywood-bg">
      <AppHeader active="Home" />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          className="max-w-md w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
              boxShadow: '0 8px 32px rgba(232,66,10,0.35)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </motion.div>

          {/* Heading */}
          <h1 className="az-headline text-white text-2xl sm:text-3xl mb-3">
            Welcome to {siteName}
          </h1>
          <p className="text-white/60 text-sm sm:text-base mb-8 leading-relaxed">
            Sign in to access your personalized homepage with recommendations, continue watching,
            and universe-specific content.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <motion.button
              type="button"
              className="az-btn-primary w-full sm:w-auto"
              style={{ paddingInline: '2rem' }}
              onClick={onLogin}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign In
            </motion.button>

            <Link href="/auth/register">
              <motion.span
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Create Account
              </motion.span>
            </Link>
          </div>

          {/* Go back link */}
          <motion.button
            type="button"
            className="mt-6 text-white/40 hover:text-white/60 text-xs transition-colors"
            onClick={onGoHome}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Continue to legacy homepage →
          </motion.button>

          {/* Auto-redirect notice */}
          <motion.p
            className="mt-4 text-white/30 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Redirecting to the homepage in a few seconds…
          </motion.p>
        </motion.div>
      </main>

      <AppFooter siteName={siteName} />
    </div>
  );
}
