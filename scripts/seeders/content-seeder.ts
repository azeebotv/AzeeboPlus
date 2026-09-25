/**
 * Content Service Seeder
 * Seeds: universes, categories, tags, content items, comments
 */

import {
  randomItem,
  randomInt,
  randomDate,
  NIGERIAN_MOVIES,
  AFROBEATS_SONGS,
  COMEDY_SPECIALS,
  REALITY_SHOWS,
  UNIVERSES,
  CATEGORIES,
  TAGS,
  printCount,
} from './utils.js';
import { themedArt } from './seed-image-hosts.js';

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod =
      await import('../../services/core/content-service/node_modules/@prisma/client/index.js');
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    universe: {
      upsert: (args: unknown) => Promise<unknown>;
      findUnique: (args: unknown) => Promise<{ id: string } | null>;
    };
    category: { upsert: (args: unknown) => Promise<unknown> };
    tag: { upsert: (args: unknown) => Promise<unknown> };
    contentItem: { upsert: (args: unknown) => Promise<unknown> };
    comment: { create: (args: unknown) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  })();
}

export async function seedContentService(dryRun = false): Promise<number> {
  let count = 0;

  if (dryRun) {
    const total =
      UNIVERSES.length +
      NIGERIAN_MOVIES.length +
      AFROBEATS_SONGS.length +
      COMEDY_SPECIALS.length +
      REALITY_SHOWS.length;
    console.log(`  [DRY RUN] Would create ${total} content records`);
    return total;
  }

  const prisma = await getClient();

  try {
    // ─── Universes ──────────────────────────────────────────────────────
    printCount('Universes', UNIVERSES.length);
    for (const universe of UNIVERSES) {
      await prisma.universe.upsert({
        where: { name: universe.name },
        create: {
          name: universe.name,
          displayName: universe.displayName,
          icon: universe.icon,
          color: universe.color,
          isEnabled: true,
          sortOrder: UNIVERSES.indexOf(universe),
        },
        update: {},
      });
      count++;
    }

    // ─── Categories ─────────────────────────────────────────────────────
    printCount('Categories', CATEGORIES.length);
    for (const cat of CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
        create: { name: cat, slug: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'), icon: cat },
        update: {},
      });
      count++;
    }

    // ─── Tags ───────────────────────────────────────────────────────────
    printCount('Tags', TAGS.length);
    for (const tag of TAGS) {
      await prisma.tag.upsert({ where: { name: tag }, create: { name: tag }, update: {} });
      count++;
    }

    // ─── Content Items ──────────────────────────────────────────────────
    const movieUniverse = await prisma.universe.findUnique({ where: { name: 'movie' } });
    const musicUniverse = await prisma.universe.findUnique({ where: { name: 'music' } });
    const comedyUniverse = await prisma.universe.findUnique({ where: { name: 'comedy' } });
    const realityUniverse = await prisma.universe.findUnique({ where: { name: 'reality' } });

    const allContent: {
      items: { title: string; desc: string; universe: string }[];
      type: string;
    }[] = [
      {
        items: NIGERIAN_MOVIES.map((m) => ({
          title: m,
          desc: `${m} — A blockbuster Nollywood film`,
          universe: movieUniverse?.id || '',
        })),
        type: 'movie',
      },
      {
        items: AFROBEATS_SONGS.map((s) => ({
          title: `${s.title} — ${s.artist}`,
          desc: `${s.title} by ${s.artist}`,
          universe: musicUniverse?.id || '',
        })),
        type: 'music',
      },
      {
        items: COMEDY_SPECIALS.map((s) => ({
          title: s.title,
          desc: `${s.title} by ${s.comedian}`,
          universe: comedyUniverse?.id || '',
        })),
        type: 'comedy',
      },
      {
        items: REALITY_SHOWS.map((r) => ({
          title: r,
          desc: `${r} — The hottest reality show`,
          universe: realityUniverse?.id || '',
        })),
        type: 'reality',
      },
    ];

    let contentIdx = 0;
    for (const group of allContent) {
      printCount(`${group.type} Content`, group.items.length);
      for (let i = 0; i < group.items.length; i++) {
        const item = group.items[i];
        await prisma.contentItem.upsert({
          where: { id: `content-${group.type}-${i}` },
          create: {
            id: `content-${group.type}-${i}`,
            title: item.title,
            description: item.desc,
            thumbnail: themedArt.poster(group.type, item.title),
            mediaUrl: seedImages.storageMedia(group.type, `${i}.mp4`),
            universeId: item.universe,
            creatorId: `creator-${i % 10}`,
            status: 'published',
            viewCount: randomInt(1000, 100000),
            publishedAt: randomDate(365),
            contentRating: randomItem(['G', 'PG', 'PG-13', 'R']),
          },
          update: {},
        });
        count++;
        contentIdx++;
      }
    }

    // ─── Comments ───────────────────────────────────────────────────────
    const commentCount = 150;
    printCount('Comments', commentCount);
    for (let i = 0; i < commentCount; i++) {
      await prisma.comment.create({
        data: {
          contentId: `content-movie-${i % NIGERIAN_MOVIES.length}`,
          userId: `usr${String((i % 50) + 1).padStart(4, '0')}`,
          text: randomItem([
            'Amazing content!',
            'Love this!',
            'Best Nollywood ever!',
            "Can't stop watching",
            'A masterpiece',
            'So entertaining',
            'Naija to the world!',
            'Fire!',
            'Incredible performance',
            'This is why I love Azeebo+',
            'Must watch!',
            'Classic!',
          ]),
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
