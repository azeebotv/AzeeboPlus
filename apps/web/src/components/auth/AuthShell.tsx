'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

/* Figma's auth backdrop is a dimmed poster wall behind one floating glass card.
   32 tiles at ~180px is what covers a laptop viewport at poster aspect; the
   optimizer serves each as a few-kilobyte WebP thumbnail. */
const BACKDROP_TILES = Array.from({ length: 32 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return `/images/posters/poster_${n}.jpg`;
});

type AuthShellProps = {
  headlineLines: string[];
  tagline?: string;
  backgroundImage?: string;
  children: React.ReactNode;
  showLogo?: boolean;
  logoVariant?: 'light' | 'orange';
};

export default function AuthShell({
  headlineLines,
  tagline,
  backgroundImage = '/images/poster_ember_queen.webp',
  children,
  showLogo = true,
  logoVariant = 'light',
}: AuthShellProps): React.JSX.Element {
  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'var(--color-az-surface-auth-void)', color: 'var(--color-az-ink)' }}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="grid h-full w-full grid-cols-4 grid-rows-8 gap-1.5 lg:grid-cols-8 lg:grid-rows-4">
          {BACKDROP_TILES.map((src) => (
            <Image
              key={src}
              src={src}
              alt=""
              width={180}
              height={240}
              sizes="(min-width: 1024px) 12.5vw, 25vw"
              quality={55}
              className="h-full w-full object-cover"
            />
          ))}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(16,0,18,0.86) 0%, rgba(16,0,18,0.78) 50%, rgba(16,0,18,0.94) 100%)',
          }}
        />
      </div>

      <motion.div
        className="az-glass relative z-10 w-full max-w-7xl p-4 sm:p-6 lg:p-10"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-8">
          {/* Cinematic panel — lives inside the card, matching the Figma frame */}
          <motion.div
            className="relative hidden overflow-hidden lg:flex lg:w-[46%] lg:min-h-[540px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            style={{
              borderRadius: 'var(--radius-az-feature)',
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                /* The poster art carries its own baked-in title, so the scrim has
                   to reach near-black before the headline starts. */
                background:
                  'linear-gradient(180deg, rgba(11,9,14,0.4) 0%, rgba(11,9,14,0.3) 45%, rgba(11,9,14,0.9) 72%, rgba(11,9,14,0.97) 100%)',
              }}
            />

            {showLogo && (
              <div className="absolute top-0 left-0 z-10 p-6">
                <BrandLogo variant={logoVariant} />
              </div>
            )}

            <div className="relative z-10 mt-auto p-6 sm:p-8">
              <h1 className="az-heading text-az-ink">
                {headlineLines.map((line, i) => (
                  <motion.span
                    key={i}
                    className="block"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.12,
                      duration: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94] as const,
                    }}
                  >
                    {line}
                  </motion.span>
                ))}
              </h1>
              {tagline && (
                <motion.p
                  className="az-body mt-4 text-az-ink/75"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + headlineLines.length * 0.12, duration: 0.5 }}
                >
                  {tagline}
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Form column */}
          <div className="relative flex flex-1 flex-col justify-center">
            {showLogo && (
              <div className="lg:hidden mb-6">
                <BrandLogo variant="light" />
              </div>
            )}
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
