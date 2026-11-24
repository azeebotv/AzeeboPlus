/**
 * Seed script for subscription plans
 * Generates subscription tiers and user subscriptions
 */

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    concurrentStreams: number;
    downloads: number;
    offlineHours: number;
    quality: string;
  };
  popular: boolean;
  enabled: boolean;
}

interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    slug: 'free',
    price: 0,
    currency: 'NGN',
    interval: 'monthly',
    features: [
      'Ad-supported content',
      '720p streaming',
      '1 concurrent stream',
      'Limited content library',
    ],
    limits: { concurrentStreams: 1, downloads: 0, offlineHours: 0, quality: '720p' },
    popular: false,
    enabled: true,
  },
  {
    id: 'plan_basic',
    name: 'Basic',
    slug: 'basic',
    price: 999,
    currency: 'NGN',
    interval: 'monthly',
    features: [
      'Ad-free content',
      '1080p streaming',
      '2 concurrent streams',
      'Full content library',
      '5 downloads per month',
    ],
    limits: { concurrentStreams: 2, downloads: 5, offlineHours: 10, quality: '1080p' },
    popular: false,
    enabled: true,
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    slug: 'premium',
    price: 2999,
    currency: 'NGN',
    interval: 'monthly',
    features: [
      'Ad-free content',
      '4K HDR streaming',
      '4 concurrent streams',
      'Full content library',
      'Unlimited downloads',
      'Offline viewing',
      'Early access to new releases',
      'Priority customer support',
    ],
    limits: { concurrentStreams: 4, downloads: 999, offlineHours: 999, quality: '4K HDR' },
    popular: true,
    enabled: true,
  },
  {
    id: 'plan_family',
    name: 'Family',
    slug: 'family',
    price: 4999,
    currency: 'NGN',
    interval: 'monthly',
    features: [
      'Everything in Premium',
      'Up to 6 profiles',
      '6 concurrent streams',
      'Parental controls',
      'Family sharing',
      'Kids profile with curated content',
    ],
    limits: { concurrentStreams: 6, downloads: 999, offlineHours: 999, quality: '4K HDR' },
    popular: false,
    enabled: true,
  },
];

// Generate yearly plans
const yearlyPlans: SubscriptionPlan[] = plans.filter(p => p.price > 0).map(p => ({
  ...p,
  id: `${p.id}_yearly`,
  slug: `${p.slug}_yearly`,
  price: Math.floor(p.price * 10), // 2 months free
  interval: 'yearly' as const,
  features: [...p.features, 'Save 2 months free!'],
}));

const USER_IDS = Array.from({ length: 50 }, (_, i) => `usr${String(i + 1).padStart(4, '0')}`);

function generateUserSubscription(index: number): UserSubscription {
  const userId = USER_IDS[index % USER_IDS.length];
  const plan = plans[Math.floor(Math.random() * plans.length)];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 365));
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + (plan.interval === 'yearly' ? 12 : 1));
  
  const statuses: UserSubscription['status'][] = ['active', 'active', 'active', 'cancelled', 'expired', 'trial'];
  
  return {
    id: `sub${String(index + 1).padStart(6, '0')}`,
    userId,
    planId: plan.id,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    startDate,
    endDate,
    autoRenew: Math.random() > 0.3,
    paymentMethod: `card_visa_${Math.floor(1000 + Math.random() * 9000)}`,
  };
}

const subscriptions = Array.from({ length: 50 }, (_, i) => generateUserSubscription(i));

console.log(`Generated ${plans.length} plans + ${yearlyPlans.length} yearly plans`);
console.log(`Generated ${subscriptions.length} user subscriptions`);
console.log('Active:', subscriptions.filter(s => s.status === 'active').length);
console.log('Cancelled:', subscriptions.filter(s => s.status === 'cancelled').length);

export { plans, yearlyPlans, subscriptions };
export default { plans, yearlyPlans, subscriptions };
