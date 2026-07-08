import { Test, TestingModule } from '@nestjs/testing';
import { AgbalaAnalyticsService } from '../agbala/analytics.service';

describe('AgbalaAnalyticsService', () => {
  let service: AgbalaAnalyticsService;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const module: TestingModule = await Test.createTestingModule({
      providers: [AgbalaAnalyticsService],
    }).compile();

    service = module.get<AgbalaAnalyticsService>(AgbalaAnalyticsService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackHubViewed', () => {
    it('should send analytics event', async () => {
      await service.trackHubViewed('user1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/analytics/events'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('agbala_hub_viewed'),
        })
      );
    });
  });

  describe('trackPathSelected', () => {
    it('should send path event', async () => {
      await service.trackPathSelected('user1', 'chronological');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('agbala_path_selected'),
        })
      );
    });
  });

  describe('trackTitleWatched', () => {
    it('should send title watched event with progress', async () => {
      await service.trackTitleWatched('user1', 'title-1', 75);
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.events[0].type).toBe('agbala_title_watched');
      expect(body.events[0].metadata.title_id).toBe('title-1');
      expect(body.events[0].metadata.progress).toBe(75);
    });
  });

  describe('trackQuizCompleted', () => {
    it('should send quiz completed event', async () => {
      await service.trackQuizCompleted('user1', 'oshun');
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.events[0].type).toBe('agbala_quiz_completed');
      expect(body.events[0].metadata.orisa_alignment).toBe('oshun');
    });
  });

  describe('trackBlackCurrentDetected', () => {
    it('should send black current event', async () => {
      await service.trackBlackCurrentDetected('user1', 'high');
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.events[0].type).toBe('agbala_black_current_detected');
      expect(body.events[0].metadata.level).toBe('high');
    });
  });

  describe('error handling', () => {
    it('should not throw on fetch failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await expect(service.trackHubViewed('user1')).resolves.not.toThrow();
    });
  });
});
