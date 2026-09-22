import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface ResultOption {
  id: string;
  label: string;
  votes: number;
  percentage: number;
  isCorrect?: boolean;
}

/** Unified result shape consumed by /participation/result/[id]. */
export interface ParticipationResult {
  id: string;
  title: string;
  type: 'poll' | 'quiz';
  totalVotes: number;
  totalParticipants: number;
  options: ResultOption[];
  pointsEarned?: number;
  userCorrect?: boolean;
}

/**
 * Unified participation result — resolves a poll result or a quiz attempt
 * result by id. Poll ids are tried first; anything that is not a poll is
 * treated as a quiz attempt id.
 *
 * For quiz attempts `options` are the quiz questions aggregated across all
 * completed attempts (votes = attempts that answered the question correctly).
 * `pointsEarned`/`userCorrect` describe the resolved attempt, where
 * `userCorrect` means a perfect score.
 */
@Injectable()
export class ParticipationService {
  private readonly logger = new Logger(ParticipationService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getResult(id: string): Promise<ParticipationResult> {
    try {
      const poll = await this.prisma.poll.findUnique({
        where: { id },
        include: { options: { orderBy: { createdAt: 'asc' } } },
      });
      if (poll && poll.status !== 'draft') {
        return this.buildPollResult(poll);
      }

      const attempt = await this.prisma.quizAttempt.findUnique({
        where: { id },
        include: { quiz: { include: { questions: { orderBy: { order: 'asc' } } } } },
      });
      if (attempt && attempt.completedAt) {
        return this.buildQuizResult(attempt);
      }

      throw new NotFoundException('Result not found');
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get participation result ${id}: ${error}`);
      throw error;
    }
  }

  private async buildPollResult(poll: {
    id: string;
    title: string;
    status: string;
    totalVotes: number;
    options: { id: string; text: string; voteCount: number }[];
  }): Promise<ParticipationResult> {
    const voters = await this.prisma.pollVote.findMany({
      where: { pollId: poll.id },
      distinct: ['userId'],
      select: { userId: true },
    });

    const options: ResultOption[] = poll.options.map((opt) => ({
      id: opt.id,
      label: opt.text,
      votes: opt.voteCount,
      percentage:
        poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0,
    }));

    return {
      id: poll.id,
      title: poll.title,
      type: 'poll' as const,
      totalVotes: poll.totalVotes,
      totalParticipants: voters.length,
      options,
    };
  }

  private async buildQuizResult(
    attempt: {
      id: string;
      userId: string;
      score: number;
      answers: unknown;
      quiz: {
        id: string;
        title: string;
        questions: { id: string; question: string; points: number }[];
      };
    }
  ): Promise<ParticipationResult> {
    const completedAttempts = await this.prisma.quizAttempt.findMany({
      where: { quizId: attempt.quiz.id, completedAt: { not: null } },
      select: { userId: true, answers: true },
    });

    const participants = new Set(completedAttempts.map((a) => a.userId)).size;
    const correctByQuestion = new Map<string, number>();
    for (const a of completedAttempts) {
      const answers = Array.isArray(a.answers) ? a.answers : [];
      for (const ans of answers as { questionId?: string; correct?: boolean }[]) {
        if (ans?.questionId && ans.correct) {
          correctByQuestion.set(ans.questionId, (correctByQuestion.get(ans.questionId) ?? 0) + 1);
        }
      }
    }

    const total = completedAttempts.length;
    const options: ResultOption[] = attempt.quiz.questions.map((q) => {
      const votes = correctByQuestion.get(q.id) ?? 0;
      return {
        id: q.id,
        label: q.question,
        votes,
        percentage: total > 0 ? Math.round((votes / total) * 100) : 0,
      };
    });

    const totalPoints = attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0);

    return {
      id: attempt.id,
      title: attempt.quiz.title,
      type: 'quiz' as const,
      totalVotes: total,
      totalParticipants: participants,
      options,
      pointsEarned: attempt.score,
      userCorrect: totalPoints > 0 && attempt.score === totalPoints,
    };
  }
}
