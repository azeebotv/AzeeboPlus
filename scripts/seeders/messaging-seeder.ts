/**
 * Messaging Service Seeder
 */

import { randomItem, randomDate, printCount } from './utils.js';

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod = await import('../../services/engagement/messaging-service/node_modules/@prisma/client/index.js');
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    conversation: { create: (args: unknown) => Promise<{ id: string }> };
    message: { create: (args: unknown) => Promise<{ id: string }> };
    messageReaction: { create: (args: unknown) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  })();
}

const MSGS = [
  'Hey! How are you?', 'Just watched the new movie, amazing!', 'Have you heard the new track?',
  'Let\'s meet up this weekend', 'Check out this comedy special', 'What\'s your favorite show?',
  'The live event was incredible!', 'I just tipped my favorite creator',
  'Have you tried the new feature?', 'Love the new UI updates!',
];

export async function seedMessagingService(dryRun = false): Promise<number> {
  let count = 0;
  if (dryRun) { console.log(`  [DRY RUN] Would create 20 conversations + 100 messages`); return 120; }

  const prisma = await getClient();
  try {
    printCount('Conversations', 20);
    const convIds: string[] = [];
    for (let i = 0; i < 20; i++) {
      const isGroup = i % 4 === 0;
      const conv = await prisma.conversation.create({
        data: {
          type: isGroup ? 'group' : 'direct',
          name: isGroup ? randomItem(['Nollywood Fans', 'Music Lovers', 'Comedy Club', 'Game Night']) : null,
          participants: {
            create: [
              { userId: `usr${String((i % 40) + 1).padStart(4, '0')}`, role: 'admin' },
              { userId: `usr${String((i + 5) % 40 + 1).padStart(4, '0')}`, role: 'member' },
              ...(isGroup ? [{ userId: `usr${String((i + 10) % 40 + 1).padStart(4, '0')}`, role: 'member' as const }] : []),
            ],
          },
        },
      });
      convIds.push((conv as { id: string }).id);
      count++;
    }

    printCount('Messages', 100);
    for (let i = 0; i < 100; i++) {
      const msg = await prisma.message.create({
        data: {
          conversationId: convIds[i % convIds.length],
          senderId: `usr${String((i % 40) + 1).padStart(4, '0')}`,
          content: randomItem(MSGS),
          type: randomItem(['text', 'text', 'text', 'image']),
          createdAt: randomDate(30),
        },
      });
      count++;
      if (i % 3 === 0) {
        await prisma.messageReaction.create({
          data: { messageId: (msg as { id: string }).id, userId: `usr${String(((i + 1) % 40) + 1).padStart(4, '0')}`, emoji: randomItem(['👍', '❤️', '😂', '🔥']) },
        });
        count++;
      }
    }

    console.log(`  Total: ${count} records`);
  } finally { await prisma.$disconnect(); }
  return count;
}
