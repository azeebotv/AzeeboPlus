import Image from 'next/image';
import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

const FALLBACK_SRC =
  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&h=600&q=80';

// URLs that should bypass Next.js image optimization (SVG or already optimized)
const UNOPTIMIZED_HOSTS: string[] = [];

function isUnoptimizedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return UNOPTIMIZED_HOSTS.some((host) => hostname.includes(host));
  } catch {
    return false;
  }
}

/**
 * OptimizedImage component that wraps Next.js Image with default optimizations
 * - Automatic WebP/AVIF format conversion
 * - Lazy loading by default
 * - Responsive sizing
 * - Blur placeholder support
 * - Error handling with fallback placeholder
 * - Bypasses optimization for SVG/placeholder URLs
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  style,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError) {
      setImgSrc(FALLBACK_SRC);
      setHasError(true);
    }
  }, [hasError]);

  const shouldUnoptimize = hasError || isUnoptimizedUrl(imgSrc);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={fill ? undefined : width || 800}
      height={fill ? undefined : height || 600}
      fill={fill}
      className={className}
      style={style}
      priority={priority}
      sizes={sizes}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      loading={priority ? 'eager' : 'lazy'}
      quality={85}
      onError={handleError}
      unoptimized={shouldUnoptimize}
    />
  );
}
