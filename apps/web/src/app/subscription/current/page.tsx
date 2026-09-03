import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription Current  - Azeebo+',
  description: 'Subscription Current  on Azeebo+',
};

import SubscriptionCurrentPage from '@/app/wallet/subscription-current/page';

export default function CurrentPage() {
  return <SubscriptionCurrentPage />;
}
