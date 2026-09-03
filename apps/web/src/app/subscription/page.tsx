import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription  - Azeebo+',
  description: 'Subscription  on Azeebo+',
};

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriptionIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/wallet/subscription-plans');
  }, [router]);

  return null;
}
