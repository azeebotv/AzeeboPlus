'use client';

import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

type AuthShellProps = {
  headlineLines: string[];
  backgroundImage?: string;
  backgroundFallback?: string;
  children: React.ReactNode;
  showLogo?: boolean;
  logoVariant?: 'light' | 'orange';
};

export default function AuthShell({
  headlineLines,
  backgroundImage,
  backgroundFallback = 'var(--brand-near-black)',
  children,
  showLogo = true,
  logoVariant = 'light',
}: AuthShellProps): React.JSX.Element {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row az-nollywood-bg">
      {/* Left cinematic panel — hidden on mobile, parallax on desktop */}
      <motion.div
        className="relative hidden lg:flex lg:w-3/5 items-end overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundColor: backgroundFallback,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark gradient scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* Ambient glow — drifts slowly */}
        <div
          className="az-ambient-red az-glow-drift"
          style={{ width: 500, height: 500, top: -150, left: -150, opacity: 0.5 }}
        />

        {showLogo && (
          <motion.div
            className="absolute top-0 left-0 p-8 z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <BrandLogo variant={logoVariant} />
          </motion.div>
        )}

        <div className="relative z-10 p-10 xl:p-14 max-w-2xl">
          <h1 className="az-headline text-white text-4xl xl:text-6xl">
            {headlineLines.map((line, i) => (
              <motion.span
                key={i}
                className="block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4 + i * 0.12,
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94] as const,
                }}
              >
                {line}
              </motion.span>
            ))}
          </h1>
        </div>
      </motion.div>

      {/* Right glass-card panel */}
      <div
        className="relative flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-10"
        style={{ backgroundColor: 'var(--brand-near-black)' }}
      >
        {/* Logo on mobile */}
        {showLogo && (
          <motion.div
            className="lg:hidden absolute top-0 left-0 p-5"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <BrandLogo variant="light" />
          </motion.div>
        )}

        {/* Ambient red glow */}
        <div
          className="az-ambient-red az-glow-drift"
          style={{ width: 350, height: 350, bottom: -100, right: -100 }}
        />

        {/* Glass card with entrance animation */}
        <motion.div
          className="az-glass az-glass--glow az-glass--breathing relative z-10 w-full max-w-md p-6 sm:p-8"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
          }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
