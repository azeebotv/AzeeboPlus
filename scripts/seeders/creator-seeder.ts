/**
 * Creator Service Seeder
 * Seeds: creator profiles, channels, earnings, challenges, tips
 */

import { generateUser, generateBanner, randomItem, randomFloat, randomDate, UNIVERSES, printCount } from './utils.js';

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod = await import('../../services/universes/creator-service/node_modules/@prisma/client/index.js');
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    universe: { upsert: (args: unknown) => Promise<unknown> };
    user: { upsert: (args: unknown) => Promise<unknown> };
    creatorProfile: { upsert: (args: unknown) => Promise<{ id: string }>; findMany: (args?: unknown) => Promise<{ id: string }[]> };
    channel: { create: (args: unknown) => Promise<unknown> };
    creatorEarning: { create: (args: unknown) => Promise<unknown> };
    creatorChallenge: { create: (args: unknown) => Promise<unknown> };
    tip: { create: (args: unknown) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  })();
}

const CREATOR_NAMES = [
  'DJ Spinall', 'Burna Boy', 'Tiwa Savage', 'Wizkid', 'Davido',
  'Naira Marley', 'Rema', 'Fireboy DML', 'Tems', 'Ayra Starr',
  'Oxlade', 'Joeboy', 'BNXN', 'Victony', 'Asake',
  'Don Jazzy', 'Olamide', 'Phyno', 'Flavour', '2Baba',
  'Basketmouth', 'AY Makun', 'Bovi', 'I Go Dye', 'Craze Clown',
  'Linda Ikeji', 'Tunde Ednut', 'Instablog9ja', 'NastyBlaze', 'Taaooma',
];

export async function seedCreatorService(dryRun = false): Promise<number> {
  const CREATOR_COUNT = 30;
  let count = 0;

  if (dryRun) {
    console.log(`  [DRY RUN] Would create ${CREATOR_COUNT} creators`);
    return CREATOR_COUNT;
  }

  const prisma = await getClient();

  try {
    for (const universe of UNIVERSES) {
      await prisma.universe.upsert({
        where: { name: universe.name },
        create: { name: universe.name, displayName: universe.displayName, icon: universe.icon },
        update: {},
      });
    }

    for (let i = 0; i < CREATOR_COUNT; i++) {
      const user = generateUser(i);
      await prisma.user.upsert({
        where: { id: user.id },
        create: { id: user.id, email: user.email, displayName: user.displayName, role: 'creator' },
        update: {},
      });
    }

    printCount('Creator Profiles', CREATOR_COUNT);
    const creatorIds: string[] = [];
    for (let i = 0; i < CREATOR_COUNT; i++) {
      const userId = `usr${String(i + 1).padStart(4, '0')}`;
      const name = CREATOR_NAMES[i % CREATOR_NAMES.length];
      const creator = await prisma.creatorProfile.upsert({
        where: { userId },
        create: {
          userId, displayName: name,
          bio: `Award-winning ${randomItem(['musician', 'actor', 'comedian', 'influencer', 'creator'])}.`,
          banner: generateBanner(i), verified: i < 15,
          socialLinks: { instagram: `https://instagram.com/${name.replace(/\s/g, '')}` },
        },
        update: {},
      });
      creatorIds.push((creator as { id: string }).id);
      count++;
    }

    printCount('Channels', 40);
    for (let i = 0; i < 40; i++) {
      await prisma.channel.create({
        data: {
          creatorId: creatorIds[i % creatorIds.length],
          name: `${randomItem(['Afrobeats', 'Nollywood', 'Comedy', 'Lifestyle', 'Sports'])} Channel`,
          category: randomItem(['music', 'comedy', 'lifestyle', 'entertainment']),
        },
      });
      count++;
    }

    printCount('Creator Earnings', 100);
    for (let i = 0; i < 100; i++) {
      await prisma.creatorEarning.create({
        data: {
          creatorId: creatorIds[i % creatorIds.length],
          amount: randomFloat(500, 50000),
          type: randomItem(['tip', 'subscription', 'rental', 'payout']),
          status: randomItem(['pending', 'completed', 'completed', 'completed']),
          createdAt: randomDate(90),
        },
      });
      count++;
    }

    printCount('Creator Challenges', 10);
    for (let i = 0; i < 10; i++) {
      const startDate = randomDate(30);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14);
      await prisma.creatorChallenge.create({
        data: {
          creatorId: creatorIds[i % creatorIds.length],
          title: randomItem(['Best Afrobeats Dance', 'Lip Sync Battle', 'Comedy Roast', 'Cook-off Challenge']),
          description: 'Show us your best skills and win amazing prizes!',
          prize: `₦${randomItem([5000, 10000, 25000, 50000, 100000])}`,
          startDate, endDate, status: i < 5 ? 'active' : 'completed',
        },
      });
      count++;
    }

    printCount('Tips', 60);
    for (let i = 0; i < 60; i++) {
      const creatorIdx = i % creatorIds.length;
      await prisma.tip.create({
        data: {
          fromUserId: `usr${String((i % 40) + 11).padStart(4, '0')}`,
          toUserId: `usr${String(creatorIdx + 1).padStart(4, '0')}`,
          creatorId: creatorIds[creatorIdx],
          amount: randomFloat(100, 5000),
          currency: 'NGN',
          message: randomItem(['Keep it up!', 'Love your work!', 'Fire!', 'Go!', '']),
          createdAt: randomDate(60),
        },
      });
      count++;
    }

    console.log(`  Total: ${count} records`);
  } finally {
    await prisma.$disconnect();
  }

  return count;
}
