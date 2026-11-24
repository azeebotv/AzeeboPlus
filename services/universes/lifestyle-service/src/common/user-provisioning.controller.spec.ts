import { Test, TestingModule } from '@nestjs/testing';
import { PollController } from '../modules/polls/poll.controller';
import { QuizController } from '../modules/quizzes/quiz.controller';
import { ChallengeController } from '../modules/challenges/challenge.controller';
import { PollService } from '../modules/polls/poll.service';
import { QuizService } from '../modules/quizzes/quiz.service';
import { ChallengeService } from '../modules/challenges/challenge.service';
import { PrismaService } from '../modules/database/prisma.service';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from '@azeebo/feature-flags';

/**
 * User-mirror provisioning contract.
 *
 * lifestyle-service keeps a local `users` table as the FK target for
 * poll votes / quiz attempts / challenge submissions. Real users live in
 * auth-service, so EVERY authenticated write must call ensureUser() before
 * touching the FK-backed tables. These tests pin that contract: if a future
 * refactor drops the ensureUser() call from a write path, the corresponding
 * test fails with "user.upsert expected 1 time".
 *
 * Regression context: votes from real (non-seed) users crashed with
 * `PollVote_userId_fkey` violations before provisioning was added.
 */

const GATEWAY_USER = {
  id: '93da188d-0011-4014-84c9-5a644bfd3a9a',
  email: 'buffy.smoke@azeebo.dev',
  role: 'creator',
};

describe('user mirror provisioning on write paths', () => {
  let prisma: { user: { upsert: jest.Mock } };

  let pollController: PollController;
  let quizController: QuizController;
  let challengeController: ChallengeController;

  const pollService = {
    createPoll: jest.fn().mockResolvedValue({ success: true, data: {} }),
    votePoll: jest.fn().mockResolvedValue({ success: true, data: { message: 'Vote recorded' } }),
  };
  const quizService = {
    createQuiz: jest.fn().mockResolvedValue({ success: true, data: {} }),
    startQuiz: jest.fn().mockResolvedValue({ success: true, data: { attemptId: 'att-1' } }),
  };
  const challengeService = {
    createChallenge: jest.fn().mockResolvedValue({ success: true, data: {} }),
    submitToChallenge: jest.fn().mockResolvedValue({ success: true, data: {} }),
    voteSubmission: jest.fn().mockResolvedValue({ success: true, data: {} }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      user: {
        upsert: jest
          .fn()
          .mockImplementation(({ create }) =>
            Promise.resolve({ id: create.id, email: create.email, role: create.role })
          ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PollController, QuizController, ChallengeController],
      providers: [
        { provide: PollService, useValue: pollService },
        { provide: QuizService, useValue: quizService },
        { provide: ChallengeService, useValue: challengeService },
        { provide: PrismaService, useValue: prisma },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn().mockReturnValue(true) } },
        {
          provide: FeatureFlagService,
          useValue: {
            isEnabled: jest.fn().mockResolvedValue(true),
            isDefined: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    pollController = module.get<PollController>(PollController);
    quizController = module.get<QuizController>(QuizController);
    challengeController = module.get<ChallengeController>(ChallengeController);
  });

  it('poll vote provisions the mirrored user before recording the vote', async () => {
    await pollController.votePoll({ user: GATEWAY_USER }, 'poll-1', { optionId: 'opt-1' });

    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { id: GATEWAY_USER.id },
      update: {},
      create: expect.objectContaining({
        id: GATEWAY_USER.id,
        email: GATEWAY_USER.email,
        role: GATEWAY_USER.role,
      }),
    });
    expect(pollService.votePoll).toHaveBeenCalledWith('poll-1', GATEWAY_USER.id, 'opt-1');
  });

  it('quiz start provisions the mirrored user before creating the attempt', async () => {
    await quizController.startQuiz({ user: GATEWAY_USER }, 'quiz-1');

    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: GATEWAY_USER.id } })
    );
    expect(quizService.startQuiz).toHaveBeenCalledWith('quiz-1', GATEWAY_USER.id);
  });

  it('challenge submission provisions the mirrored user before creating the row', async () => {
    await challengeController.submitToChallenge({ user: GATEWAY_USER }, 'challenge-1', {
      content: 'my entry',
    });

    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(challengeService.submitToChallenge).toHaveBeenCalledWith(
      'challenge-1',
      GATEWAY_USER.id,
      { content: 'my entry' }
    );
  });

  it('challenge submission vote also provisions (ChallengeVote has the same user FK)', async () => {
    await challengeController.voteSubmission({ user: GATEWAY_USER }, 'submission-1');

    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(challengeService.voteSubmission).toHaveBeenCalledWith('submission-1', GATEWAY_USER.id);
  });

  it('ensureUser is idempotent — re-voting does not blow up on the upsert', async () => {
    await pollController.votePoll({ user: GATEWAY_USER }, 'poll-1', { optionId: 'opt-1' });
    await pollController.votePoll({ user: GATEWAY_USER }, 'poll-1', { optionId: 'opt-1' });

    expect(prisma.user.upsert).toHaveBeenCalledTimes(2);
  });

  it('create poll (author path) provisions too — Poll.createdById is FK-backed', async () => {
    await pollController.createPoll({ user: GATEWAY_USER }, {
      title: 'New poll',
      options: [{ text: 'A' }, { text: 'B' }],
    } as never);

    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(pollService.createPoll).toHaveBeenCalledWith(GATEWAY_USER.id, expect.anything());
  });

  it('quiz create provisions (Quiz.createdById FK) and challenge create provisions', async () => {
    await quizController.createQuiz({ user: GATEWAY_USER }, {
      title: 'Q',
      questions: [],
    } as never);
    await challengeController.createChallenge({ user: GATEWAY_USER }, {
      title: 'C',
    } as never);

    expect(prisma.user.upsert).toHaveBeenCalledTimes(2);
  });
});
