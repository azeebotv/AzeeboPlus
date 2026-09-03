import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription Payment  - Azeebo+',
  description: 'Subscription Payment  on Azeebo+',
};

import SubscriptionPaymentPage from '@/app/wallet/subscription-payment/page';

export default function PaymentPage() {
  return <SubscriptionPaymentPage />;
}
