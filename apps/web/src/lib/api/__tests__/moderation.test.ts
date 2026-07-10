import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createModerationMethods } from '../moderation';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('Moderation API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let moderation: ReturnType<typeof createModerationMethods>;

  beforeEach(() => {
    client = createMockClient();
    moderation = createModerationMethods(client);
  });

  it('reportContent should POST to /api/v1/moderation/report', async () => {
    client.request.mockResolvedValue({ success: true, data: { message: 'Report submitted' } });

    await moderation.reportContent('c1', 'spam', 'This is spam content');

    expect(client.request).toHaveBeenCalledWith('/api/v1/moderation/report', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'c1',
        reason: 'spam',
        description: 'This is spam content',
        type: 'report',
      }),
    });
  });

  it('reportContent should work without description', async () => {
    client.request.mockResolvedValue({ success: true, data: { message: 'Report submitted' } });

    await moderation.reportContent('c1', 'inappropriate');

    expect(client.request).toHaveBeenCalledWith('/api/v1/moderation/report', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'c1',
        reason: 'inappropriate',
        description: undefined,
        type: 'report',
      }),
    });
  });
});
