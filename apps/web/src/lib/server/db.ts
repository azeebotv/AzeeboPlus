// Server-side database access layer for Azeebo+ Web API routes.
// Connects to local PostgreSQL database microservices in a single monorepo session.

import { PrismaClient as SportsPrisma } from '../../../../../services/universes/sports-service/src/prisma/client';
import { PrismaClient as RealityPrisma } from '../../../../../services/universes/reality-service/src/prisma/client';
import { PrismaClient as LifestylePrisma } from '../../../../../services/universes/lifestyle-service/src/prisma/client';
import { PrismaClient as VerticalPrisma } from '../../../../../services/universes/vertical-service/src/prisma/client';
import { PrismaClient as LivePrisma } from '../../../../../services/universes/live-event-service/src/prisma/client';
import { PrismaClient as MoviePrisma } from '../../../../../services/universes/movie-service/src/prisma/client';
import { PrismaClient as SubPrisma } from '../../../../../services/engagement/subscription-service/src/prisma/client';
import { PrismaClient as PaymentPrisma } from '../../../../../services/core/payment-service/src/prisma/client';
import { PrismaClient as GamesPrisma } from '../../../../../services/universes/games-service/src/prisma/client';
import { PrismaClient as ContentPrisma } from '../../../../../services/core/content-service/src/prisma/client';

const globalForDb = globalThis as unknown as {
  sportsDb?: SportsPrisma;
  realityDb?: RealityPrisma;
  lifestyleDb?: LifestylePrisma;
  verticalDb?: VerticalPrisma;
  liveDb?: LivePrisma;
  movieDb?: MoviePrisma;
  subDb?: SubPrisma;
  paymentDb?: PaymentPrisma;
  gamesDb?: GamesPrisma;
  contentDb?: ContentPrisma;
};

export const getSportsDb = () => {
  if (!globalForDb.sportsDb) {
    globalForDb.sportsDb = new SportsPrisma({
      datasources: {
        db: {
          url:
            process.env.SPORTS_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_sports?schema=public',
        },
      },
    });
  }
  return globalForDb.sportsDb;
};

export const getRealityDb = () => {
  if (!globalForDb.realityDb) {
    globalForDb.realityDb = new RealityPrisma({
      datasources: {
        db: {
          url:
            process.env.REALITY_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_reality?schema=public',
        },
      },
    });
  }
  return globalForDb.realityDb;
};

export const getLifestyleDb = () => {
  if (!globalForDb.lifestyleDb) {
    globalForDb.lifestyleDb = new LifestylePrisma({
      datasources: {
        db: {
          url:
            process.env.LIFESTYLE_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_lifestyle?schema=public',
        },
      },
    });
  }
  return globalForDb.lifestyleDb;
};

export const getVerticalDb = () => {
  if (!globalForDb.verticalDb) {
    globalForDb.verticalDb = new VerticalPrisma({
      datasources: {
        db: {
          url:
            process.env.VERTICAL_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_vertical?schema=public',
        },
      },
    });
  }
  return globalForDb.verticalDb;
};

export const getLiveDb = () => {
  if (!globalForDb.liveDb) {
    globalForDb.liveDb = new LivePrisma({
      datasources: {
        db: {
          url:
            process.env.LIVE_EVENT_DATABASE_URL ||
            'postgresql://azeebo:azeebo_dev_2024@127.0.0.1:5432/azeebo_live_event?schema=public',
        },
      },
    });
  }
  return globalForDb.liveDb;
};

export const getMovieDb = () => {
  if (!globalForDb.movieDb) {
    globalForDb.movieDb = new MoviePrisma({
      datasources: {
        db: {
          url:
            process.env.MOVIE_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_movie?schema=public',
        },
      },
    });
  }
  return globalForDb.movieDb;
};

export const getSubDb = () => {
  if (!globalForDb.subDb) {
    globalForDb.subDb = new SubPrisma({
      datasources: {
        db: {
          url:
            process.env.SUBSCRIPTION_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_subscription?schema=public',
        },
      },
    });
  }
  return globalForDb.subDb;
};

export const getPaymentDb = () => {
  if (!globalForDb.paymentDb) {
    globalForDb.paymentDb = new PaymentPrisma({
      datasources: {
        db: {
          url:
            process.env.PAYMENT_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_payment?schema=public',
        },
      },
    });
  }
  return globalForDb.paymentDb;
};

export const getGamesDb = () => {
  if (!globalForDb.gamesDb) {
    globalForDb.gamesDb = new GamesPrisma({
      datasources: {
        db: {
          url:
            process.env.GAMES_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_games?schema=public',
        },
      },
    });
  }
  return globalForDb.gamesDb;
};

export const getContentDb = () => {
  if (!globalForDb.contentDb) {
    globalForDb.contentDb = new ContentPrisma({
      datasources: {
        db: {
          url:
            process.env.CONTENT_DATABASE_URL ||
            'postgresql://azeebo:change-me-in-production@localhost:5432/azeebo_content?schema=public',
        },
      },
    });
  }
  return globalForDb.contentDb;
};
