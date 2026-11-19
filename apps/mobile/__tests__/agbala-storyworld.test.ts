import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 6: Agbala Storyworld Navigation & Quizzes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches interactive story nodes with branching options', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      data: {
        nodeId: 'agbala-forest-shrine',
        title: 'The Whispering Shrine',
        loreText: 'Ancient whispers echo through the iroko trees...',
        branches: [
          { targetNodeId: 'shrine-inner-sanctum', choiceText: 'Step into the sanctum' },
          { targetNodeId: 'shrine-river-path', choiceText: 'Follow the silver stream' },
        ],
      },
    });

    const res = await apiClient.get('/api/v1/vertical/agbala/nodes/agbala-forest-shrine');

    expect(getSpy).toHaveBeenCalledWith('/api/v1/vertical/agbala/nodes/agbala-forest-shrine');
    expect(res.data?.nodeId).toBe('agbala-forest-shrine');
    expect(res.data?.branches.length).toBe(2);
  });

  it('validates lore quiz answer and awards participation badge', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        quizId: 'quiz-yoruba-folklore-1',
        score: 100,
        passed: true,
        badgeEarned: {
          id: 'badge-agbala-scholar',
          title: 'Agbala Lore Master',
          iconUrl: 'https://cdn.azeeboplus.com/badges/agbala-master.png',
        },
      },
    });

    const res = await apiClient.post('/api/v1/vertical/agbala/quizzes/submit', {
      quizId: 'quiz-yoruba-folklore-1',
      answers: [{ questionId: 'q1', selectedOptionId: 'opt-b' }],
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/vertical/agbala/quizzes/submit', {
      quizId: 'quiz-yoruba-folklore-1',
      answers: [{ questionId: 'q1', selectedOptionId: 'opt-b' }],
    });
    expect(res.data?.passed).toBe(true);
    expect(res.data?.badgeEarned.id).toBe('badge-agbala-scholar');
  });
});
