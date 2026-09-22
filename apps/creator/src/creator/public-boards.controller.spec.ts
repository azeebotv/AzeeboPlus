import { PublicBoardsController } from './public-boards.controller';

describe('PublicBoardsController', () => {
  const buildController = (board: Record<string, unknown>) => {
    const creatorService = {
      getChallengeLeaderboard: jest.fn().mockResolvedValue(board),
    };
    const jwtService = { verify: jest.fn().mockImplementation(() => { throw new Error('no token'); }) };
    return {
      controller: new PublicBoardsController(creatorService as never, jwtService as never),
      creatorService,
      jwtService,
    };
  };

  const fullBoard = {
    challenge: { id: 'ch1', title: 'Dance Marathon', prize: 250000, endDate: '2026-09-30' },
    totalEntries: 2,
    entries: [
      { position: 1, entryId: 'e2', userId: 'u2', displayName: 'Winner', status: 'winner', submittedAt: '2026-09-20T00:00:00Z' },
      { position: 2, entryId: 'e1', userId: 'u1', displayName: 'Rookie', status: 'pending', submittedAt: '2026-09-19T00:00:00Z' },
    ],
  };

  describe('GET /creator/boards/:challengeId (public data)', () => {
    const NO_COOKIES = { headers: {}, cookies: {} } as never;

    it('returns the board without user identifiers (all isOwn false when logged out)', async () => {
      const { controller } = buildController(fullBoard);

      const res = await controller.getPublicBoard('ch1', NO_COOKIES);

      expect(res.success).toBe(true);
      expect(res.data.challenge).toEqual(fullBoard.challenge);
      expect(res.data.entries[0]).toEqual({
        position: 1,
        displayName: 'Winner',
        status: 'winner',
        submittedAt: '2026-09-20T00:00:00Z',
        isOwn: false,
      });
      expect(JSON.stringify(res.data)).not.toContain('userId');
      expect(JSON.stringify(res.data)).not.toContain('entryId');
    });

    it('delegates to the shared leaderboard service', async () => {
      const { controller, creatorService } = buildController(fullBoard);

      await controller.getPublicBoard('ch1', NO_COOKIES);

      expect(creatorService.getChallengeLeaderboard).toHaveBeenCalledWith('ch1');
    });

    it('marks only the viewer\u2019s own row isOwn:true from a valid session cookie', async () => {
      const { controller, jwtService } = buildController(fullBoard);
      jwtService.verify.mockReturnValue({ sub: 'u1' });
      const req = { headers: {}, cookies: { access_token: 'valid.jwt.token' } } as never;

      const res = await controller.getPublicBoard('ch1', req);

      expect(res.data.entries[0].isOwn).toBe(false); // u2
      expect(res.data.entries[1].isOwn).toBe(true); // u1
      expect(JSON.stringify(res.data)).not.toContain('u1');
    });

    it('ignores invalid/expired tokens and stays logged-out (isOwn all false)', async () => {
      const { controller, jwtService } = buildController(fullBoard);
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      const req = { headers: {}, cookies: { access_token: 'garbage' } } as never;

      const res = await controller.getPublicBoard('ch1', req);

      expect(res.data.entries.every((e: { isOwn: boolean }) => e.isOwn === false)).toBe(true);
      expect(res.success).toBe(true);
    });

    it('prefers the Bearer header over the cookie when both exist', async () => {
      const { controller, jwtService } = buildController(fullBoard);
      jwtService.verify.mockImplementation((_token: string) => {
        if (_token === 'header-token') return { sub: 'u2' };
        return { sub: 'u1' };
      });
      const req = {
        headers: { authorization: 'Bearer header-token' },
        cookies: { access_token: 'cookie-token' },
      } as never;

      const res = await controller.getPublicBoard('ch1', req);

      expect(res.data.entries[0].isOwn).toBe(true); // u2 via header
    });
  });

  describe('GET /boards/:challengeId (OG page)', () => {
    beforeAll(() => {
      // The controller reads client/dist/index.html relative to the compiled
      // file. Point it at a fixture by creating the expected layout under dist.
      const fs = require('fs') as typeof import('fs');
      const path = require('path') as typeof import('path');
      const dir = path.join(__dirname, '..', '..', 'client', 'dist');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'index.html'),
        '<!DOCTYPE html><html><head><title>Azeebo+ Creator Portal</title></head><body><div id="root"></div></body></html>'
      );
    });

    afterAll(() => {
      const fs = require('fs') as typeof import('fs');
      const path = require('path') as typeof import('path');
      fs.rmSync(path.join(__dirname, '..', '..', 'client', 'dist'), { recursive: true, force: true });
    });

    const buildRes = () => {
      const res = {
        type: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      return res as unknown as { type: jest.Mock; send: jest.Mock };
    };

    it('serves the SPA HTML with OG tags injected after </title>', async () => {
      const { controller } = buildController(fullBoard);
      const res = buildRes();

      await controller.getBoardPage('ch1', res as never);

      expect(res.type).toHaveBeenCalledWith('html');
      const html = res.send.mock.calls[0][0] as string;
      expect(html).toContain('<meta property="og:type" content="website" />');
      expect(html).toContain('Dance Marathon — Challenge Leaderboard | Azeebo+');
      expect(html).toContain('Prize ₦250,000');
      expect(html).toContain('Winner: Winner');
      expect(html).toContain('<meta name="twitter:card" content="summary" />');
      // Injected right after the title, keeping the SPA shell intact.
      expect(html.indexOf('og:title')).toBeGreaterThan(html.indexOf('<title>'));
      expect(html).toContain('<div id="root">');
    });

    it('escapes HTML metacharacters in challenge and winner names', async () => {
      const { controller } = buildController({
        ...fullBoard,
        challenge: { ...fullBoard.challenge, title: '<script>"evil"&co</script>' },
        entries: [
          { position: 1, entryId: 'e2', userId: 'u2', displayName: 'A"B&C', status: 'winner', submittedAt: '2026-09-20T00:00:00Z' },
        ],
      });
      const res = buildRes();

      await controller.getBoardPage('ch1', res as never);

      const html = res.send.mock.calls[0][0] as string;
      expect(html).toContain('&lt;script&gt;&quot;evil&quot;&amp;co&lt;/script&gt;');
      expect(html).toContain('A&quot;B&amp;C');
      expect(html).not.toContain('<script>"evil"');
    });

    it('handles empty boards without a winner line', async () => {
      const { controller } = buildController({
        challenge: { id: 'ch1', title: 'Empty Board' },
        totalEntries: 0,
        entries: [],
      });
      const res = buildRes();

      await controller.getBoardPage('ch1', res as never);

      const html = res.send.mock.calls[0][0] as string;
      expect(html).toContain('0 entries');
      expect(html).toContain('Winner announced soon');
      expect(html).not.toContain('Winner:');
    });
  });
});
