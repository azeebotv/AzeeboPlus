import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface LeaderboardEntryData {
  id: string;
  userId: string;
  displayName: string;
  avatar: string | null;
  score: number;
  rank: number;
  category: string;
  timePeriod: string;
}

interface PredictionData {
  id: string;
  userId: string;
  contentId: string;
  prediction: string;
  points: number;
  isCorrect: boolean | null;
  result: string | null;
  createdAt: Date;
}

interface RankingData {
  id: string;
  userId: string;
  displayName: string;
  avatar: string | null;
  score: number;
  rank: number;
  category: string;
}

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(timePeriod = 'weekly', category = 'all', limit = 50) {
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: {
        timePeriod,
        category,
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: entries.map((entry: LeaderboardEntryData, index: number) => ({
        id: entry.id,
        userId: entry.userId,
        displayName: entry.displayName,
        avatar: entry.avatar,
        score: entry.score,
        rank: index + 1,
        category: entry.category,
        timePeriod: entry.timePeriod,
      })),
    };
  }

  async getRankings() {
    const categories = ['all', 'gaming', 'content', 'social', 'predictions'];
    const rankings = await Promise.all(
      categories.map(async (category) => {
        const entries = await this.prisma.ranking.findMany({
          where: { category },
          orderBy: { score: 'desc' },
          take: 10,
        });

        return {
          category,
          rankings: entries.map((entry: RankingData, index: number) => ({
            id: entry.id,
            userId: entry.userId,
            displayName: entry.displayName,
            avatar: entry.avatar,
            score: entry.score,
            rank: index + 1,
          })),
        };
      })
    );

    return {
      success: true,
      data: rankings,
    };
  }

  async getPredictionResults(userId: string, contentId: string) {
    const predictions = await this.prisma.prediction.findMany({
      where: {
        userId,
        contentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalPoints = predictions.reduce(
      (sum: number, p: PredictionData) => sum + (p.points || 0),
      0
    );
    const correctCount = predictions.filter((p: PredictionData) => p.isCorrect).length;

    return {
      success: true,
      data: {
        predictions: predictions.map((p: PredictionData) => ({
          id: p.id,
          prediction: p.prediction,
          points: p.points,
          isCorrect: p.isCorrect,
          result: p.result,
          createdAt: p.createdAt.toISOString(),
        })),
        summary: {
          totalPredictions: predictions.length,
          correctPredictions: correctCount,
          accuracy: predictions.length > 0 ? (correctCount / predictions.length) * 100 : 0,
          totalPoints,
        },
      },
    };
  }

  async submitPrediction(userId: string, contentId: string, prediction: string, points: number) {
    const newPrediction = await this.prisma.prediction.create({
      data: {
        userId,
        contentId,
        prediction,
        points,
      },
    });

    this.logger.log(`Prediction submitted by user ${userId} for content ${contentId}`);

    return {
      success: true,
      data: {
        id: newPrediction.id,
        prediction: newPrediction.prediction,
        points: newPrediction.points,
        createdAt: newPrediction.createdAt.toISOString(),
      },
    };
  }

  async updateLeaderboard(
    userId: string,
    displayName: string,
    avatar: string | null,
    score: number,
    category: string,
    timePeriod: string
  ) {
    const existing = await this.prisma.leaderboardEntry.findUnique({
      where: {
        userId_category_timePeriod: {
          userId,
          category,
          timePeriod,
        },
      },
    });

    if (existing) {
      await this.prisma.leaderboardEntry.update({
        where: { id: existing.id },
        data: {
          score: { increment: score },
          displayName,
          avatar,
        },
      });
    } else {
      await this.prisma.leaderboardEntry.create({
        data: {
          userId,
          displayName,
          avatar,
          score,
          category,
          timePeriod,
        },
      });
    }

    return { success: true, message: 'Leaderboard updated' };
  }
}
