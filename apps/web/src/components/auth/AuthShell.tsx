import React from 'react';
import BrandLogo from './BrandLogo';

type AuthShellProps = {
  /** Headline copy overlaid on the left photo panel (supports line breaks via array) */
  headlineLines: string[];
  /** Background image URL for the left cinematic panel */
  backgroundImage?: string;
  /** Solid fallback background color for the left panel (used when no image) */
  backgroundFallback?: string;
  /** Right-panel glass card content */
  children: React.ReactNode;
  /** Show the Azeebo logo top-left over the photo panel (default true) */
  showLogo?: boolean;
  /** Logo variant on the photo panel */
  logoVariant?: 'light' | 'orange';
};

/**
 * Split-layout auth shell — full-bleed cinematic photo panel (60%) on the left
 * with a bold white marketing headline, and a frosted glass card (40%) on the
 * right containing the form. The signature Azeebo+ glass-panel motif.
 *
 * Collapses to a single dark column with the glass card on top on small screens.
 */
export default function AuthShell({
  headlineLines,
  backgroundImage,
  backgroundFallback = '#1A0A0A',
  children,
  showLogo = true,
  logoVariant = 'light',
}: AuthShellProps): React.JSX.Element {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Left cinematic panel */}
      <div
        className="relative hidden lg:flex lg:w-3/5 items-end overflow-hidden"
        style={{
          backgroundColor: backgroundFallback,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark gradient scrim for headline legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {showLogo && (
          <div className="absolute top-0 left-0 p-8 z-10">
            <BrandLogo variant={logoVariant} />
          </div>
        )}

        <div className="relative z-10 p-10 xl:p-14 max-w-2xl">
          <h1 className="az-headline text-white text-4xl xl:text-6xl">
            {headlineLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
        </div>
      </div>

      {/* Right glass-card panel */}
      <div
        className="relative flex-1 flex items-center justify-center p-6 sm:p-10"
        style={{ backgroundColor: '#1A0A0A' }}
      >
        {/* Logo on mobile (left panel hidden) */}
        {showLogo && (
          <div className="lg:hidden absolute top-0 left-0 p-6">
            <BrandLogo variant="light" />
          </div>
        )}

        {/* Ambient red glow for atmospheric depth */}
        <div
          className="az-ambient-red"
          style={{ width: 400, height: 400, bottom: -120, right: -120 }}
        />

        <div className="az-glass az-glass--glow relative z-10 w-full max-w-md p-7 sm:p-9">
          {children}
        </div>
      </div>
    </div>
  );
}
