'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatorSignupRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/creators/signup');
  }, [router]);

  return null;
}
