/**
 * Seed script for payment transactions
 * Generates 100 realistic transaction records across all payment types
 */

interface Transaction {
  id: string;
  userId: string;
  type: 'wallet_topup' | 'subscription' | 'content_purchase' | 'tip' | 'refund';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const USER_IDS = Array.from({ length: 50 }, (_, i) => `usr${String(i + 1).padStart(4, '0')}`);

const PAYMENT_METHODS = [
  'card_visa_4242',
  'card_mastercard_5555',
  'card_amex_3782',
  'wallet_balance',
  'bank_transfer',
  'mobile_money',
  'apple_pay',
  'google_pay',
];

const CONTENT_TYPES = ['movie', 'music_track', 'comedy_special', 'reality_episode', 'game'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTransaction(index: number): Transaction {
  const type = randomItem<Transaction['type']>(['wallet_topup', 'subscription', 'content_purchase', 'tip', 'refund']);
  const userId = randomItem(USER_IDS);
  
  let amount: number;
  let description: string;
  let paymentMethod: string;

  switch (type) {
    case 'wallet_topup':
      amount = randomItem([500, 1000, 2000, 5000, 10000, 20000]);
      description = `Wallet top-up of ₦${amount.toLocaleString()}`;
      paymentMethod = randomItem(PAYMENT_METHODS.filter(m => m !== 'wallet_balance'));
      break;
    case 'subscription':
      amount = randomItem([999, 1999, 4999, 9999]);
      description = `Subscription payment`;
      paymentMethod = randomItem(PAYMENT_METHODS);
      break;
    case 'content_purchase':
      amount = randomItem([100, 200, 500, 1000, 1500, 2000]);
      description = `Purchased ${randomItem(CONTENT_TYPES)}`;
      paymentMethod = randomItem(PAYMENT_METHODS);
      break;
    case 'tip':
      amount = randomItem([50, 100, 200, 500, 1000]);
      description = `Tip to creator`;
      paymentMethod = 'wallet_balance';
      break;
    case 'refund':
      amount = -randomItem([100, 200, 500, 1000]);
      description = `Refund for previous purchase`;
      paymentMethod = randomItem(PAYMENT_METHODS);
      break;
  }

  const status = randomItem<Transaction['status']>(['completed', 'completed', 'completed', 'pending', 'failed']);

  const daysAgo = Math.floor(Math.random() * 90);
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

  return {
    id: `txn${String(index + 1).padStart(6, '0')}`,
    userId,
    type,
    amount,
    currency: 'NGN',
    status,
    paymentMethod,
    description,
    metadata: {
      platform: randomItem(['web', 'ios', 'android']),
      ip: `197.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    },
    createdAt,
  };
}

const transactions = Array.from({ length: 100 }, (_, i) => generateTransaction(i));

console.log(`Generated ${transactions.length} transactions`);
console.log('Types:', Object.entries(
  transactions.reduce((acc, t) => ({ ...acc, [t.type]: (acc[t.type] || 0) + 1 }), {} as Record<string, number>)
).map(([k, v]) => `${k}: ${v}`).join(', '));
console.log('Total volume:', transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString(), 'NGN');

export default transactions;
