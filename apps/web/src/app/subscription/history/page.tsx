import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription History  - Azeebo+',
  description: 'Subscription History  on Azeebo+',
};

import SubscriptionHistoryPage from '@/app/wallet/subscription-history/page';

export default function HistoryPage() {
  return <SubscriptionHistoryPage />;
}
