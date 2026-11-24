'use client';

import { ImgHTMLAttributes, useState } from 'react';

interface AccessibleImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
  fallback?: string;
}

export function AccessibleImage({ alt, fallback, onError, ...props }: AccessibleImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    onError?.(e);
  };

  if (hasError && fallback) {
    return <img src={fallback} alt={alt} {...props} />;
  }

  return <img alt={alt} onError={handleError} {...props} />;
}
