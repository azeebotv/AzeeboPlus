/**
 * Seed script for referral program
 * Generates 20 referral records
 */

interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  code: string;
  status: 'pending' | 'completed' | 'expired';
  rewardAmount: number;
  rewardStatus: 'pending' | 'credited' | 'expired';
  createdAt: Date;
  completedAt?: Date;
}

const USER_IDS = Array.from({ length: 50 }, (_, i) => `usr${String(i + 1).padStart(4, '0')}`);

function generateReferral(index: number): Referral {
  const referrerId = USER_IDS[index % USER_IDS.length];
  let referredId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
  while (referredId === referrerId) {
    referredId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
  }

  const code = `AZP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const status = Math.random() > 0.3 ? 'completed' : Math.random() > 0.5 ? 'pending' : 'expired';
  const rewardAmount = 500;
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90));

  let completedAt: Date | undefined;
  let rewardStatus: Referral['rewardStatus'] = 'pending';
  if (status === 'completed') {
    completedAt = new Date(createdAt);
    completedAt.setDate(completedAt.getDate() + Math.floor(1 + Math.random() * 7));
    rewardStatus = 'credited';
  } else if (status === 'expired') {
    rewardStatus = 'expired';
  }

  return {
    id: `ref${String(index + 1).padStart(4, '0')}`,
    referrerId,
    referredId,
    code,
    status,
    rewardAmount,
    rewardStatus,
    createdAt,
    completedAt,
  };
}

const referrals = Array.from({ length: 20 }, (_, i) => generateReferral(i));

console.log(`Generated ${referrals.length} referrals`);
console.log('Completed:', referrals.filter(r => r.status === 'completed').length);
console.log('Pending:', referrals.filter(r => r.status === 'pending').length);
console.log('Expired:', referrals.filter(r => r.status === 'expired').length);

export default referrals;
