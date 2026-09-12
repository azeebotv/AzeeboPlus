import Image from 'next/image';

type BrandLogoProps = {
  /** Color of the wordmark (for compatibility). */
  variant?: 'light' | 'orange';
  className?: string;
  width?: number;
  height?: number;
};

/**
 * Azeebo+ Brand Logo — renders the official vector SVG brand logomark.
 */
export default function BrandLogo({
  variant = 'light',
  className = '',
  width = 115,
  height = 28,
}: BrandLogoProps): React.JSX.Element {
  const logoSrc = variant === 'orange' ? '/images/logo-primary.png' : '/images/logo-white.png';

  return (
    <span className={`inline-flex items-center ${className}`} role="img" aria-label="Azeebo+">
      <Image
        src={logoSrc}
        alt="Azeebo+"
        width={width}
        height={height}
        className="h-6 sm:h-7 w-auto object-contain transition-all"
        priority
      />
    </span>
  );
}
