/**
 * Lifestyle Service Seeder — participation module (polls, quizzes, challenges)
 *
 * Seeds active/published community-participation rows so the web
 * /participation hub and its detail pages render real content:
 *   - GET /api/v1/polls                (web /participation hub — Fan Polls)
 *   - GET /api/v1/polls/:id + /vote    (web /participation/poll/[id])
 *   - GET /api/v1/quizzes              (hub — Trivia & Quizzes)
 *   - GET /api/v1/quizzes/:id + start/submit (web /participation/quiz/[id])
 *   - GET /api/v1/challenges?status=active (hub — Community Challenges)
 *   - GET /api/v1/challenges/:id + /submit  (web /participation/challenge/[id])
 *
 * Design notes:
 *  - Idempotent: upserts by slug (fixed demo slugs), safe to re-run.
 *  - All rows belong to SEED_USER so the users-table FK is satisfied.
 *  - Quiz questions use the DB shape: options text[] + correctAnswer index.
 *  - One poll is seeded `closed` to exercise the expired-state UI.
 */

import { printCount } from './utils.js';

const SEED_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'seed@azeebo.test',
  displayName: 'Seed Curator',
  role: 'user',
} as const;

interface SeedPoll {
  title: string;
  slug: string;
  description: string;
  status: 'active' | 'closed';
  totalVotes: number;
  expiresInDays?: number;
  options: { text: string; votes: number }[];
}

interface SeedQuiz {
  title: string;
  slug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  timeLimit?: number;
  playCount: number;
  questions: { question: string; options: string[]; correctAnswer: number; explanation?: string }[];
}

interface SeedChallenge {
  title: string;
  slug: string;
  description: string;
  type: string;
  status: string;
  rules: string;
  prize: string;
  participantCount: number;
  startInDays: number;
  endInDays: number;
}

const POLLS: SeedPoll[] = [
  {
    title: 'Who nailed the finale dance?',
    slug: 'seed-finale-dance-poll',
    description: 'Last night’s finale had three show-stopping performances — pick your winner.',
    status: 'active',
    totalVotes: 1284,
    expiresInDays: 7,
    options: [
      { text: 'Chidi & Amara', votes: 612 },
      { text: 'Tunde Squad', votes: 401 },
      { text: 'The Lagos Lions', votes: 271 },
    ],
  },
  {
    title: 'Best Nollywood film of the year?',
    slug: 'seed-nollywood-film-poll',
    description: 'Community vote for the film that defined the year on Azeebo+.',
    status: 'active',
    totalVotes: 5320,
    expiresInDays: 30,
    options: [
      { text: 'Ijo (The Dance)', votes: 2210 },
      { text: 'Yellow Fever', votes: 1802 },
      { text: 'The Lagos Heist', votes: 1308 },
    ],
  },
  {
    title: 'Which genre should we green-light next?',
    slug: 'seed-genre-poll',
    description: 'Tell the content team what to commission next season.',
    status: 'closed',
    totalVotes: 940,
    options: [
      { text: 'Afro-noir thriller', votes: 540 },
      { text: 'Rom-com series', votes: 400 },
    ],
  },
];

const QUIZZES: SeedQuiz[] = [
  {
    title: 'Nollywood Trivia Night',
    slug: 'seed-nollywood-trivia-night',
    description: 'Five questions on Nollywood classics, box-office hits, and behind-the-scenes lore.',
    difficulty: 'easy',
    category: 'Nollywood',
    timeLimit: 300,
    playCount: 3_412,
    questions: [
      {
        question: 'Which city is considered the home of Nollywood film production?',
        options: ['Lagos', 'Accra', 'Nairobi', 'Abuja'],
        correctAnswer: 0,
        explanation: 'Nollywood grew out of the Idumota market cluster in Lagos Island.',
      },
      {
        question: '“Living in Bondage” (1992) is widely credited with starting which era?',
        options: ['The home-video boom', 'Cinema golden age', 'Streaming era', 'Silent film era'],
        correctAnswer: 0,
        explanation: 'Its direct-to-VHS success launched the modern Nigerian video film industry.',
      },
      {
        question: 'Which 2023 biopic became one of Nollywood’s highest-grossing cinema releases?',
        options: ['A Tribe Called Judah', 'Chief Daddy', 'The Wedding Party', 'King of Boys'],
        correctAnswer: 0,
        explanation: 'Funke Akindele’s “A Tribe Called Judah” crossed the ₦1 billion mark.',
      },
      {
        question: 'Genevieve Nnaji made her directorial debut with which film?',
        options: ['Lionheart', 'Road to Yesterday', 'Akomaje', 'Ije'],
        correctAnswer: 0,
        explanation: '“Lionheart” (2018) was also Nigeria’s first Oscar submission for Best International Feature.',
      },
      {
        question: 'What does the slang “home video” refer to?',
        options: [
          'Films distributed on VHS/DVD for home viewing',
          'Family documentary shorts',
          ' Wedding recordings',
          'TV reality clips',
        ],
        correctAnswer: 0,
      },
    ],
  },
  {
    title: 'Afrobeats Superfan Quiz',
    slug: 'seed-afrobeats-superfan-quiz',
    description: 'From Fela to Grammy nights — how deep does your Afrobeats knowledge run?',
    difficulty: 'medium',
    category: 'Music',
    playCount: 2_208,
    questions: [
      {
        question: 'Who is widely called the father of Afrobeat?',
        options: ['Fela Kuti', 'King Sunny Adé', 'Burna Boy', 'Femi Kuti'],
        correctAnswer: 0,
      },
      {
        question: 'Which Burna Boy album won the 2021 Grammy for Best Global Music Album?',
        options: ['Twice as Tall', 'African Giant', 'Love, Damini', 'Outside'],
        correctAnswer: 0,
      },
      {
        question: '“Water” and “Rush” are global hits by which artist?',
        options: ['Tyla', 'Ayra Starr', 'Tems', 'Asake'],
        correctAnswer: 0,
      },
      {
        question: 'Wizkid’s 2020 hit “Essence” features which artist?',
        options: ['Tems', 'Tyla', 'Ayra Starr', 'Tiwa Savage'],
        correctAnswer: 0,
      },
    ],
  },
  {
    title: 'Reality TV Memory Challenge',
    slug: 'seed-reality-tv-memory-challenge',
    description: 'Evictions, Super Votes, and diary-room drama — test your reality-universe memory.',
    difficulty: 'hard',
    category: 'Reality',
    playCount: 1_105,
    questions: [
      {
        question: 'How many daily standard votes does a regular Azeebo+ fan get?',
        options: ['100', '10', 'Unlimited', '5'],
        correctAnswer: 0,
        explanation: 'Standard votes use your daily allowance; Super Votes carry extra weight.',
      },
      {
        question: 'What is the diary room?',
        options: [
          'A private room where contestants share confessions with Big Brother',
          'The set of the live show',
          'The jury area',
          'A fan-chat feature',
        ],
        correctAnswer: 0,
      },
    ],
  },
];

const CHALLENGES: SeedChallenge[] = [
  {
    title: 'Fan Art Showdown',
    slug: 'seed-fan-art-showdown',
    description: 'Submit your best fan art celebrating any Azeebo+ universe — winners get featured on the home page.',
    type: 'photo',
    status: 'active',
    rules: '1. Original artwork only.\n2. Reference at least one Azeebo+ title or universe.\n3. One submission per creator.\n4. Keep it community-friendly.',
    prize: '₦150,000',
    participantCount: 42,
    startInDays: -7,
    endInDays: 14,
  },
  {
    title: 'Dance Challenge: Finale Moves',
    slug: 'seed-dance-finale-moves',
    description: 'Recreate the finale dance from this season’s reality show and tag your clip #AzeeboFinale.',
    type: 'video',
    status: 'active',
    rules: '1. Clips up to 60 seconds.\n2. Post your original performance.\n3. Winners chosen by community votes.',
    prize: '₦250,000',
    participantCount: 118,
    startInDays: -14,
    endInDays: 7,
  },
  {
    title: 'Nollywood Pitch Weekend',
    slug: 'seed-nollywood-pitch-weekend',
    description: 'Pitch a one-line logline for the next Azeebo+ Original. Best ten pitches get a script-read session.',
    type: 'creative',
    status: 'active',
    rules: '1. One logline per entry.\n2. Original concepts only.\n3. Judges’ decision is final.',
    prize: '₦75,000',
    participantCount: 23,
    startInDays: -3,
    endInDays: 4,
  },
  {
    title: 'Launch Week Trivia Gauntlet',
    slug: 'seed-launch-week-trivia-gauntlet',
    description: 'A completed challenge kept for history — shows the ended-state UI correctly.',
    type: 'quiz',
    status: 'completed',
    rules: 'Archived challenge rules.',
    prize: '₦50,000',
    participantCount: 210,
    startInDays: -60,
    endInDays: -30,
  },
];

let PrismaClient: new (args?: unknown) => unknown;

type PollOptionClient = { upsert: (args: unknown) => Promise<{ id: string }> };
interface ParticipationClient {
  user: { upsert: (args: unknown) => Promise<{ id: string }> };
  poll: {
    upsert: (args: unknown) => Promise<{ id: string }>;
    count: (args?: unknown) => Promise<number>;
  };
  pollOption: PollOptionClient;
  quiz: {
    upsert: (args: unknown) => Promise<{ id: string }>;
    count: (args?: unknown) => Promise<number>;
  };
  quizQuestion: PollOptionClient;
  challenge: {
    upsert: (args: unknown) => Promise<{ id: string }>;
    count: (args?: unknown) => Promise<number>;
  };
  $disconnect: () => Promise<void>;
}

async function getClient(): Promise<ParticipationClient> {
  try {
    const mod = await import(
      '../../services/universes/lifestyle-service/src/prisma/client/index.js'
    );
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => ParticipationClient)();
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

export async function seedLifestyleParticipation(dryRun = false): Promise<number> {
  const totalRows = POLLS.length * 2 + QUIZZES.length + QUIZZES.reduce((n, q) => n + q.questions.length, 0) + CHALLENGES.length;
  if (dryRun) {
    console.log(
      `  [DRY RUN] Would upsert seed user + ${POLLS.length} polls (${POLLS.reduce((n, p) => n + p.options.length, 0)} options) + ` +
        `${QUIZZES.length} quizzes (${QUIZZES.reduce((n, q) => n + q.questions.length, 0)} questions) + ${CHALLENGES.length} challenges`
    );
    return totalRows;
  }

  const prisma = await getClient();
  try {
    await prisma.user.upsert({
      where: { id: SEED_USER.id },
      create: { ...SEED_USER },
      update: {},
    });

    printCount('Polls', POLLS.length);
    for (const poll of POLLS) {
      const base = {
        title: poll.title,
        description: poll.description,
        status: poll.status,
        totalVotes: poll.totalVotes,
        expiresAt: poll.expiresInDays ? daysFromNow(poll.expiresInDays) : null,
      };
      const row = await prisma.poll.upsert({
        where: { slug: poll.slug },
        create: { ...base, slug: poll.slug, createdById: SEED_USER.id },
        update: base,
      });
      for (const opt of poll.options) {
        const optBase = { pollId: row.id, text: opt.text, voteCount: opt.votes };
        await prisma.pollOption.upsert({
          where: { id: `${poll.slug}::${opt.text}`.slice(0, 36) },
          create: { id: `${poll.slug}::${opt.text}`.slice(0, 36), ...optBase },
          update: { voteCount: opt.votes },
        });
      }
    }

    printCount('Quizzes', QUIZZES.length);
    for (const quiz of QUIZZES) {
      const base = {
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        category: quiz.category ?? null,
        timeLimit: quiz.timeLimit ?? null,
        playCount: quiz.playCount,
        status: 'published',
      };
      const row = await prisma.quiz.upsert({
        where: { slug: quiz.slug },
        create: { ...base, slug: quiz.slug, createdById: SEED_USER.id },
        update: base,
      });
      for (const [order, q] of quiz.questions.entries()) {
        const qBase = {
          quizId: row.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          points: 10,
          order,
        };
        await prisma.quizQuestion.upsert({
          where: { id: `${quiz.slug}::q${order}`.slice(0, 36) },
          create: { id: `${quiz.slug}::q${order}`.slice(0, 36), ...qBase },
          update: qBase,
        });
      }
    }

    printCount('Challenges', CHALLENGES.length);
    for (const challenge of CHALLENGES) {
      const base = {
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        status: challenge.status,
        rules: challenge.rules,
        prize: challenge.prize,
        participantCount: challenge.participantCount,
        startDate: daysFromNow(challenge.startInDays),
        endDate: daysFromNow(challenge.endInDays),
      };
      await prisma.challenge.upsert({
        where: { slug: challenge.slug },
        create: { ...base, slug: challenge.slug, createdById: SEED_USER.id },
        update: base,
      });
    }

    const [polls, quizzes, challenges] = await Promise.all([
      prisma.poll.count(),
      prisma.quiz.count(),
      prisma.challenge.count(),
    ]);
    console.log(`  → participation: ${polls} polls / ${quizzes} quizzes / ${challenges} challenges`);

    return totalRows;
  } finally {
    await prisma.$disconnect();
  }
}
