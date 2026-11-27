import { PrismaClient as PaymentPrisma } from '../services/core/payment-service/src/prisma/client';
import { PrismaClient as SportsPrisma } from '../services/universes/sports-service/src/prisma/client';

async function main() {
  console.log('Seeding Coin Packages in azeebo_payment...');
  const paymentPrisma = new PaymentPrisma({
    datasources: {
      db: {
        url: 'postgresql://azeebo:azeebo_dev_2024@127.0.0.1:5432/azeebo_payment?schema=public',
      },
    },
  });

  const coinPackages = [
    {
      id: 'coins-100',
      name: '100 Voting Coins',
      description: 'Reality TV evictions & Super-Votes',
      coins: 100,
      price: 1000,
      currency: 'NGN',
      bonus: 0,
      isPopular: false,
      isActive: true,
      order: 1,
    },
    {
      id: 'coins-500',
      name: '500 Voting Coins (10% Bonus)',
      description: 'High-stake eviction voting pack',
      coins: 500,
      price: 4500,
      currency: 'NGN',
      bonus: 50,
      isPopular: true,
      isActive: true,
      order: 2,
    },
    {
      id: 'coins-1200',
      name: '1,200 Voting Coins (20% Bonus)',
      description: 'Tribal Council Super-Vote Power Pack',
      coins: 1200,
      price: 10000,
      currency: 'NGN',
      bonus: 200,
      isPopular: false,
      isActive: true,
      order: 3,
    },
    {
      id: 'coins-2500',
      name: '2,500 Voting Coins (VIP)',
      description: 'Ultimate Season Pass & Super-Vote Multiplier',
      coins: 2500,
      price: 20000,
      currency: 'NGN',
      bonus: 500,
      isPopular: false,
      isActive: true,
      order: 4,
    },
  ];

  for (const pkg of coinPackages) {
    await paymentPrisma.coinPackage.upsert({
      where: { id: pkg.id },
      update: pkg,
      create: pkg,
    });
  }
  console.log(`✓ Seeded ${coinPackages.length} coin packages.`);

  console.log('Seeding Sports Players in azeebo_sports...');
  const sportsPrisma = new SportsPrisma({
    datasources: {
      db: {
        url: 'postgresql://azeebo:azeebo_dev_2024@127.0.0.1:5432/azeebo_sports?schema=public',
      },
    },
  });

  // Home: Enyimba International FC (tm1-sport-001)
  const enyimbaPlayers = [
    { id: 'eny-01', teamId: 'tm1-sport-001', name: 'Olorunleke Ojo', number: 1, position: 'GK', gridX: 50, gridY: 90, rating: 7.8, isCaptain: true },
    { id: 'eny-02', teamId: 'tm1-sport-001', name: 'Bilal Yakubu', number: 2, position: 'RB', gridX: 85, gridY: 72, rating: 7.2 },
    { id: 'eny-03', teamId: 'tm1-sport-001', name: 'Somtochukwu Uche', number: 5, position: 'CB', gridX: 63, gridY: 75, rating: 7.4 },
    { id: 'eny-04', teamId: 'tm1-sport-001', name: 'Pascal Eze', number: 6, position: 'CB', gridX: 37, gridY: 75, rating: 7.5 },
    { id: 'eny-05', teamId: 'tm1-sport-001', name: 'Imo Obot', number: 3, position: 'LB', gridX: 15, gridY: 72, rating: 7.1 },
    { id: 'eny-06', teamId: 'tm1-sport-001', name: 'Chibuike Nwaiwu', number: 4, position: 'CDM', gridX: 38, gridY: 55, rating: 7.6 },
    { id: 'eny-07', teamId: 'tm1-sport-001', name: 'Daniel Daga', number: 8, position: 'CDM', gridX: 62, gridY: 55, rating: 8.1 },
    { id: 'eny-08', teamId: 'tm1-sport-001', name: 'Eze Ekwutoziam', number: 7, position: 'RW', gridX: 82, gridY: 34, rating: 7.7 },
    { id: 'eny-09', teamId: 'tm1-sport-001', name: 'Mbaoma Chijioke', number: 10, position: 'CAM', gridX: 50, gridY: 38, rating: 8.3 },
    { id: 'eny-10', teamId: 'tm1-sport-001', name: 'Joseph Atule', number: 11, position: 'LW', gridX: 18, gridY: 34, rating: 7.9 },
    { id: 'eny-11', teamId: 'tm1-sport-001', name: 'Alade Balogun', number: 9, position: 'ST', gridX: 50, gridY: 15, rating: 8.0 },
  ];

  // Away: Remo Stars FC (tm2-sport-001)
  const remoPlayers = [
    { id: 'rem-01', teamId: 'tm2-sport-001', name: 'Kayode Bankole', number: 1, position: 'GK', gridX: 50, gridY: 90, rating: 7.5 },
    { id: 'rem-02', teamId: 'tm2-sport-001', name: 'Sodiq Ismail', number: 2, position: 'RB', gridX: 85, gridY: 72, rating: 8.2 },
    { id: 'rem-03', teamId: 'tm2-sport-001', name: 'Nduka Junior', number: 5, position: 'CB', gridX: 63, gridY: 75, rating: 7.9, isCaptain: true },
    { id: 'rem-04', teamId: 'tm2-sport-001', name: 'Ahmed Akinyele', number: 6, position: 'CB', gridX: 37, gridY: 75, rating: 7.4 },
    { id: 'rem-05', teamId: 'tm2-sport-001', name: 'Seun Ogunribide', number: 3, position: 'LB', gridX: 15, gridY: 72, rating: 7.3 },
    { id: 'rem-06', teamId: 'tm2-sport-001', name: 'Dayo Ojo', number: 4, position: 'CDM', gridX: 50, gridY: 56, rating: 7.7 },
    { id: 'rem-07', teamId: 'tm2-sport-001', name: 'Qudus Akanni', number: 8, position: 'CM', gridX: 65, gridY: 45, rating: 7.6 },
    { id: 'rem-08', teamId: 'tm2-sport-001', name: 'Franck Mawuena', number: 10, position: 'CAM', gridX: 35, gridY: 42, rating: 7.8 },
    { id: 'rem-09', teamId: 'tm2-sport-001', name: 'Adams Olamilekan', number: 7, position: 'RW', gridX: 82, gridY: 30, rating: 7.5 },
    { id: 'rem-10', teamId: 'tm2-sport-001', name: 'Sikiru Alimi', number: 9, position: 'ST', gridX: 50, gridY: 14, rating: 8.4 },
    { id: 'rem-11', teamId: 'tm2-sport-001', name: 'Dela Akorli', number: 11, position: 'LW', gridX: 18, gridY: 30, rating: 7.4 },
  ];

  for (const p of [...enyimbaPlayers, ...remoPlayers]) {
    await sportsPrisma.sportsPlayer.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }
  console.log(`✓ Seeded ${enyimbaPlayers.length + remoPlayers.length} sports players.`);

  await paymentPrisma.$disconnect();
  await sportsPrisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
