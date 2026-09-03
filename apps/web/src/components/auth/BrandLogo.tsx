type BrandLogoProps = {
  /** Color of the "azeebo" wordmark. Use white on dark/near-black, orange on green. */
  variant?: 'light' | 'orange';
  className?: string;
};

/**
 * Azeebo+ wordmark — custom "azeebo" wordmark with an orange "+" superscript.
 * Slightly rounded, bold sans-serif (Montserrat).
 */
export default function BrandLogo({
  variant = 'light',
  className = '',
}: BrandLogoProps): React.JSX.Element {
  const wordmarkColor = variant === 'orange' ? 'var(--brand-orange)' : 'white';

  return (
    <span
      className={`az-wordmark ${className}`}
      style={{ color: wordmarkColor, fontSize: '1.5rem' }}
      aria-label="Azeebo+"
      role="img"
    >
      azeebo<span className="az-wordmark__plus">+</span>
    </span>
  );
}
