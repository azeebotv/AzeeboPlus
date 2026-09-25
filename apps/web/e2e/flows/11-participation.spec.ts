/**
 * F-011 — Community Participation Flow (polls, quizzes, challenges)
 *
 * Tests the /participation hub and its three detail flows against mocked
 * lifestyle-service APIs (same mock pattern as the other flow specs), so the
 * suite runs without a live backend:
 *
 *   hub     GET /api/v1/polls | /quizzes | /challenges
 *   poll    GET /api/v1/polls/:id        POST /api/v1/polls/:id/vote
 *   quiz    GET /api/v1/quizzes/:id      POST /api/v1/quizzes/:id/start
 *                                        POST /api/v1/quizzes/attempts/:id/submit
 *   chal    GET /api/v1/challenges/:id   POST /api/v1/challenges/:id/submit
 */
import { test, expect, type Page } from '@playwright/test';
import { mockApiForAuth } from './helpers';

const POLL = {
  id: 'poll-e2e-1',
  title: 'E2E Poll — pick a winner',
  description: 'E2E seeded poll',
  status: 'active',
  totalVotes: 10,
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  options: [
    { id: 'opt-a', text: 'Option Alpha', imageUrl: null, voteCount: 6 },
    { id: 'opt-b', text: 'Option Beta', imageUrl: null, voteCount: 4 },
  ],
};

const QUIZ_META = {
  id: 'quiz-e2e-1',
  title: 'E2E Quiz — trivia night',
  description: 'E2E seeded quiz',
  difficulty: 'easy',
  category: null,
  timeLimit: null,
  status: 'published',
  playCount: 7,
};

const QUIZ_START = {
  attemptId: 'attempt-e2e-1',
  questions: [
    { id: 'q1', question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], points: 10 },
    { id: 'q2', question: 'Capital of Nigeria?', options: ['Lagos', 'Abuja', 'Kano', 'Enugu'], points: 10 },
  ],
  timeLimit: null,
};

const CHALLENGE = {
  id: 'challenge-e2e-1',
  title: 'E2E Challenge — art showdown',
  slug: 'e2e-art-showdown',
  description: 'E2E seeded challenge',
  coverImage: null,
  type: 'photo',
  status: 'active',
  rules: 'Be kind. Original work only.',
  prize: '₦100,000',
  startDate: new Date(Date.now() - 86_400_000).toISOString(),
  endDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  participantCount: 12,
  submissions: [{ id: 'sub-1', content: 'Existing entry', mediaUrl: null, votes: 3 }],
};

async function mockParticipationApis(page: Page, { authed = true }: { authed?: boolean } = {}) {
  if (authed) {
    await mockApiForAuth(page);
  } else {
    // True logged-out variant: no seeded session storage, and the identity
    // endpoints fail so AuthContext never flips isAuthenticated.
    await page.route('**/api/v1/users/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false }),
      }),
    );
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false }),
      }),
    );
  }

  // Hub listings
  await page.route('**/api/v1/polls?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { polls: [POLL] } }),
    }),
  );
  await page.route('**/api/v1/quizzes?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { quizzes: [QUIZ_META] } }),
    }),
  );
  await page.route('**/api/v1/challenges?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { challenges: [CHALLENGE] } }),
    }),
  );

  // Poll detail + vote
  await page.route('**/api/v1/polls/poll-e2e-1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { poll: POLL } }),
    }),
  );
  await page.route('**/api/v1/polls/poll-e2e-1/vote', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { message: 'Vote recorded' } }),
    }),
  );

  // Quiz meta + attempt lifecycle
  await page.route('**/api/v1/quizzes/quiz-e2e-1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { quiz: QUIZ_META } }),
    }),
  );
  await page.route('**/api/v1/quizzes/quiz-e2e-1/start', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: QUIZ_START }),
    }),
  );
  await page.route('**/api/v1/quizzes/attempts/attempt-e2e-1/submit', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { score: 20, totalQuestions: 2, correctAnswers: 2 },
      }),
    }),
  );

  // Challenge detail + submit
  await page.route('**/api/v1/challenges/challenge-e2e-1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { challenge: CHALLENGE } }),
    }),
  );
  await page.route('**/api/v1/challenges/challenge-e2e-1/submit', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { message: 'Entry submitted' } }),
    }),
  );
}

test.describe('F-011: Participation hub', () => {
  test('hub renders all three sections with seeded cards', async ({ page }) => {
    await mockParticipationApis(page);
    await page.goto('/participation');

    await expect(page.getByText('Vote, Play & Compete')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Community Challenges' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Trivia & Quizzes/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fan Polls' })).toBeVisible();

    await expect(page.getByText(CHALLENGE.title)).toBeVisible();
    await expect(page.getByText(QUIZ_META.title)).toBeVisible();
    await expect(page.getByText(POLL.title)).toBeVisible();
  });

  test('challenge cards link to their detail page', async ({ page }) => {
    await mockParticipationApis(page);
    await page.goto('/participation');

    await page.getByText(CHALLENGE.title).first().click();
    await expect(page).toHaveURL(new RegExp(`/participation/challenge/${CHALLENGE.id}`), {
      // Next dev compiles the detail route on first navigation — allow for it
      timeout: 20_000,
    });
  });
});

test.describe('F-011: Poll voting', () => {
  test('shows options with vote counts and sign-in CTA when logged out', async ({ page }) => {
    await mockParticipationApis(page, { authed: false });
    await page.goto(`/participation/poll/${POLL.id}`);

    await expect(page.getByText(POLL.title)).toBeVisible();
    await expect(page.getByText('Option Alpha')).toBeVisible();
    await expect(page.getByText('Option Beta')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('logged-in user can select an option and record a vote', async ({ page }) => {
    await mockParticipationApis(page);
    await page.goto(`/participation/poll/${POLL.id}`);

    await page.getByRole('button', { name: /Option Alpha/ }).click();
    await page.getByRole('button', { name: /Confirm & Submit Vote/i }).click();

    await expect(page.getByText(/Your vote has been recorded/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('VOTE RECORDED')).toBeVisible();
  });
});

test.describe('F-011: Quiz flow', () => {
  test('logged-out quiz page shows the sign-in gate', async ({ page }) => {
    await mockParticipationApis(page, { authed: false });
    await page.goto(`/participation/quiz/${QUIZ_META.id}`);

    await expect(page.getByText('Sign in to play')).toBeVisible({ timeout: 10_000 });
  });

  test('user plays through questions and sees the graded result', async ({ page }) => {
    await mockParticipationApis(page);
    await page.goto(`/participation/quiz/${QUIZ_META.id}`);

    // Q1: pick "4" — buttons read "<letter> <option text>"
    await expect(page.getByText('What is 2 + 2?')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'B 4', exact: true }).click();
    await page.getByRole('button', { name: /Next Question/i }).click();

    // Q2: pick "Abuja"
    await expect(page.getByText('Capital of Nigeria?')).toBeVisible();
    await page.getByRole('button', { name: 'B Abuja', exact: true }).click();
    await page.getByRole('button', { name: /Submit Quiz & Claim Points/i }).click();

    // Graded completion state shows the real score from the API
    await expect(page.getByText('Quiz Completed!')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/2\/2 correct · 20 points/)).toBeVisible();
  });
});

test.describe('F-011: Challenge submission', () => {
  test('challenge page shows prize, rules, metrics, and submissions', async ({ page }) => {
    await mockParticipationApis(page);
    await page.goto(`/participation/challenge/${CHALLENGE.id}`);

    await expect(page.getByText(CHALLENGE.title)).toBeVisible();
    await expect(page.getByText('₦100,000', { exact: true })).toBeVisible(); // prize stat
    await expect(page.getByText('Entry Criteria & Rules')).toBeVisible();
    await expect(page.getByText('Top Submissions')).toBeVisible();
    await expect(page.getByText('Existing entry')).toBeVisible();
  });

  test('signed-in user can submit an entry and see the confirmation', async ({ page }) => {
    await mockParticipationApis(page);
    await page.goto(`/participation/challenge/${CHALLENGE.id}`);

    await page.getByRole('button', { name: /Submit Your Official Entry/i }).click();

    await expect(page.getByText(/Official entry confirmed/i)).toBeVisible({ timeout: 10_000 });
  });

  test('ended challenge shows the closed state instead of a submit button', async ({ page }) => {
    await mockParticipationApis(page);
    await page.route('**/api/v1/challenges/challenge-e2e-1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            challenge: {
              ...CHALLENGE,
              status: 'completed',
              endDate: new Date(Date.now() - 5 * 86_400_000).toISOString(),
            },
          },
        }),
      }),
    );
    await page.goto(`/participation/challenge/${CHALLENGE.id}`);

    await expect(page.getByText(/This challenge is currently/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Submit Your Official Entry/i })).toHaveCount(0);
  });
});
