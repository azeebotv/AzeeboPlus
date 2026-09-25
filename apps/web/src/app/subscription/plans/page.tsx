import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription Plans  - Azeebo+',
  description: 'Subscription Plans  on Azeebo+',
};

import SubscriptionPlansPage from '@/app/wallet/subscription-plans/page';

export default function PlansPage() {
  return <SubscriptionPlansPage />;
}
