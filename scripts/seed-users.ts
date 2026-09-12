/**
 * Seed Users Script
 * Generates 50 diverse user profiles for testing
 *
 * Run: npx tsx scripts/seed-users.ts
 */

import { PrismaClient } from '@prisma/client';
import { seedImages } from './seeders/seed-image-hosts.js';

const prisma = new PrismaClient();

const firstNames = [
  'Adaeze',
  'Chukwuemeka',
  'Ngozi',
  'Oluwaseun',
  'Amina',
  'Emeka',
  'Fatima',
  'Tunde',
  'Chioma',
  'Yusuf',
  'Blessing',
  'Chidi',
  'Halima',
  'Kayode',
  'Ifeoma',
  'Abubakar',
  'Nneka',
  'Oladipo',
  'Zainab',
  'Chinedu',
  'Aisha',
  'Babatunde',
  'Chiamaka',
  'Damilare',
  'Ezinne',
  'Folake',
  'Gbadamosi',
  'Hauwa',
  'Ibrahim',
  'Jumoke',
  'Kemi',
  'Lawal',
  'Maryam',
  'Nkem',
  'Obinna',
  'Petra',
  'Quadri',
  'Rashidat',
  'Suleiman',
  'Titilayo',
  'Uche',
  'Victoria',
  'Wale',
  'Xena',
  'Yemi',
  'Zainab',
  'Adamu',
  'Blessing',
  'Chidera',
  'Daniel',
];

const lastNames = [
  'Okafor',
  'Adeyemi',
  'Ibrahim',
  'Eze',
  'Mohammed',
  'Nwosu',
  'Balogun',
  'Chukwuma',
  'Abubakar',
  'Okonkwo',
  'Adeleke',
  'Ogundimu',
  'Aliyu',
  'Obi',
  'Yusuf',
  'Olawale',
  'Chineke',
  'Suleiman',
  'Nnamdi',
  'Bakare',
  'Ogundele',
  'Abdullahi',
  'Ekwueme',
  'Lawal',
  'Ogundipe',
  'Ifeanyi',
  'Abdulrahman',
  'Chukwu',
  'Oladimeji',
  'Aliyu',
  'Okorie',
  'Adegoke',
  'Uchechukwu',
  'Mohammed',
  'Ogundiran',
  'Chizoba',
  'Ibrahim',
  'Obiora',
  'Yakubu',
  'Nneka',
  'Adewale',
  'Fatima',
  'Chukwudi',
  'Aminu',
  'Oluwadamilola',
  'Emeka',
  'Aisha',
  'Tunde',
  'Chioma',
  'Usman',
];

const roles = ['user', 'creator', 'user', 'user', 'user']; // 20% creators

const preferences = [
  { language: 'en', notifications: true, autoplay: true },
  { language: 'yo', notifications: true, autoplay: false },
  { language: 'ig', notifications: false, autoplay: true },
  { language: 'ha', notifications: true, autoplay: true },
  { language: 'pcm', notifications: false, autoplay: false },
];

async function seedUsers() {
  console.log('Seeding users...');

  const users = [];

  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const role = roles[i % roles.length] as 'user' | 'creator';
    const pref = preferences[i % preferences.length];

    users.push({
      email,
      displayName: `${firstName} ${lastName}`,
      avatar: seedImages.picsum(email, 200, 200),
      role,
      password: '', // Social login users
      isVerified: Math.random() > 0.3, // 70% verified
      preferences: pref,
    });
  }

  // Create users
  for (const userData of users) {
    try {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData,
      });
      console.log(`Created user: ${userData.email}`);
    } catch (error) {
      console.error(`Failed to create user ${userData.email}:`, error);
    }
  }

  console.log(`Seeded ${users.length} users`);
}

async function main() {
  try {
    await seedUsers();
    console.log('User seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
