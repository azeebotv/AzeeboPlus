import { Test, TestingModule } from '@nestjs/testing';
import { GameRealtimeService } from './game-realtime.service';

describe('GameRealtimeService', () => {
  let service: GameRealtimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameRealtimeService],
    }).compile();

    service = module.get<GameRealtimeService>(GameRealtimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new game session', async () => {
      const session = await service.createSession('trivia', 'host-1', 4);

      expect(session.id).toBeDefined();
      expect(session.gameId).toBe('trivia');
      expect(session.hostId).toBe('host-1');
      expect(session.players).toEqual(['host-1']);
      expect(session.status).toBe('waiting');
      expect(session.maxPlayers).toBe(4);
    });

    it('should default to 2 max players', async () => {
      const session = await service.createSession('trivia', 'host-1');

      expect(session.maxPlayers).toBe(2);
    });
  });

  describe('joinSession', () => {
    it('should allow player to join', async () => {
      const session = await service.createSession('trivia', 'host-1');
      const updated = await service.joinSession(session.id, 'player-2');

      expect(updated.players).toContain('player-2');
      expect(updated.players).toHaveLength(2);
    });

    it('should throw when session not found', async () => {
      await expect(service.joinSession('nonexistent', 'player-1')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should throw when session is full', async () => {
      const session = await service.createSession('trivia', 'host-1', 2);
      await service.joinSession(session.id, 'player-2');

      await expect(service.joinSession(session.id, 'player-3')).rejects.toThrow('Session is full');
    });

    it('should throw when player already in session', async () => {
      const session = await service.createSession('trivia', 'host-1');

      await expect(service.joinSession(session.id, 'host-1')).rejects.toThrow('Already in session');
    });

    it('should throw when session is in progress', async () => {
      const session = await service.createSession('trivia', 'host-1', 4);
      await service.joinSession(session.id, 'player-2');
      await service.startSession(session.id);

      await expect(service.joinSession(session.id, 'player-3')).rejects.toThrow(
        'Cannot join session in progress'
      );
    });
  });

  describe('leaveSession', () => {
    it('should allow player to leave', async () => {
      const session = await service.createSession('trivia', 'host-1');
      await service.joinSession(session.id, 'player-2');
      await service.leaveSession(session.id, 'player-2');

      const updated = await service.getPlayerSession('player-2');
      expect(updated).toBeUndefined();
    });

    it('should cancel session when all players leave', async () => {
      const session = await service.createSession('trivia', 'host-1');
      await service.leaveSession(session.id, 'host-1');

      const gameSessions = service.getGameSessions('trivia');
      expect(gameSessions).toHaveLength(0);
    });

    it('should reassign host when host leaves', async () => {
      const session = await service.createSession('trivia', 'host-1');
      await service.joinSession(session.id, 'player-2');
      await service.leaveSession(session.id, 'host-1');

      const updated = await service.joinSession(session.id, 'player-3');
      expect(updated.hostId).toBe('player-2');
    });

    it('should handle leaving non-existent session gracefully', async () => {
      await expect(service.leaveSession('nonexistent', 'player-1')).resolves.not.toThrow();
    });
  });

  describe('startSession', () => {
    it('should start session with enough players', async () => {
      const session = await service.createSession('trivia', 'host-1');
      await service.joinSession(session.id, 'player-2');

      const started = await service.startSession(session.id);

      expect(started.status).toBe('in_progress');
      expect(started.startedAt).toBeDefined();
    });

    it('should throw when not enough players', async () => {
      const session = await service.createSession('trivia', 'host-1');

      await expect(service.startSession(session.id)).rejects.toThrow('Need at least 2 players');
    });

    it('should throw when session not found', async () => {
      await expect(service.startSession('nonexistent')).rejects.toThrow('Session not found');
    });
  });

  describe('updateState', () => {
    it('should update session state', async () => {
      const session = await service.createSession('trivia', 'host-1');
      await service.updateState(session.id, 'host-1', { score: 100 });

      const updated = await service.getPlayerSession('host-1');
      expect(updated?.state).toEqual({ score: 100 });
    });

    it('should merge state updates', async () => {
      const session = await service.createSession('trivia', 'host-1');
      await service.updateState(session.id, 'host-1', { score: 100 });
      await service.updateState(session.id, 'host-1', { level: 5 });

      const updated = await service.getPlayerSession('host-1');
      expect(updated?.state).toEqual({ score: 100, level: 5 });
    });

    it('should ignore updates from non-players', async () => {
      const session = await service.createSession('trivia', 'host-1');
      await service.updateState(session.id, 'outsider', { hack: true });

      const updated = await service.getPlayerSession('host-1');
      expect(updated?.state).toEqual({});
    });
  });

  describe('getGameSessions', () => {
    it('should return active sessions for a game', async () => {
      await service.createSession('trivia', 'host-1');
      await service.createSession('trivia', 'host-2');
      await service.createSession('chess', 'host-3');

      const triviaSessions = service.getGameSessions('trivia');

      expect(triviaSessions).toHaveLength(2);
    });

    it('should exclude cancelled sessions', async () => {
      const session = await service.createSession('trivia', 'host-1');
      await service.leaveSession(session.id, 'host-1');

      const sessions = service.getGameSessions('trivia');

      expect(sessions).toHaveLength(0);
    });
  });
});
