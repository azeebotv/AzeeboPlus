/**
 * Seed script for movie genres
 * Run with: npx ts-node prisma/seed/genres.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultGenres = [
  { name: 'African', slug: 'african', description: 'African cinema and content', icon: '🌍', sortOrder: 1 },
  { name: 'Hollywood', slug: 'hollywood', description: 'Hollywood blockbusters', icon: '🎬', sortOrder: 2 },
  { name: 'Nollywood', slug: 'nollywood', description: 'Nigerian cinema', icon: '🇳🇬', sortOrder: 3 },
  { name: 'Bollywood', slug: 'bollywood', description: 'Indian cinema', icon: '🇮🇳', sortOrder: 4 },
  { name: 'Comedy', slug: 'comedy', description: 'Comedy films and stand-up', icon: '😂', sortOrder: 5 },
  { name: 'Action', slug: 'action', description: 'Action and adventure films', icon: '💥', sortOrder: 6 },
  { name: 'Drama', slug: 'drama', description: 'Drama and serious films', icon: '🎭', sortOrder: 7 },
  { name: 'Horror', slug: 'horror', description: 'Horror and thriller films', icon: '👻', sortOrder: 8 },
  { name: 'Romance', slug: 'romance', description: 'Romantic films', icon: '💕', sortOrder: 9 },
  { name: 'Sci-Fi', slug: 'sci-fi', description: 'Science fiction films', icon: '🚀', sortOrder: 10 },
  { name: 'Documentary', slug: 'documentary', description: 'Documentary films', icon: '📽️', sortOrder: 11 },
  { name: 'Animation', slug: 'animation', description: 'Animated films', icon: '🎨', sortOrder: 12 },
  { name: 'Thriller', slug: 'thriller', description: 'Suspense and thriller films', icon: '🔍', sortOrder: 13 },
  { name: 'Musical', slug: 'musical', description: 'Musical films', icon: '🎵', sortOrder: 14 },
  { name: 'Fantasy', slug: 'fantasy', description: 'Fantasy and magical films', icon: '🧙', sortOrder: 15 },
];

async function seedGenres() {
  console.log('🎬 Seeding movie genres...\n');

  let created = 0;
  let skipped = 0;

  for (const genre of defaultGenres) {
    try {
      const existing = await prisma.genre.findUnique({
        where: { slug: genre.slug },
      });

      if (existing) {
        console.log(`⏭️  Genre "${genre.name}" already exists, skipping`);
        skipped++;
        continue;
      }

      await prisma.genre.create({ data: genre });
      console.log(`✅ Created genre: ${genre.name} (${genre.slug})`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create genre "${genre.name}": ${(error as Error).message}`);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

seedGenres()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
