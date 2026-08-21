import { Injectable, Logger } from '@nestjs/common';

export interface GameSession {
  id: string;
  gameId: string;
  hostId: string;
  players: string[];
  status: 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled';
  maxPlayers: number;
  state: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

@Injectable()
export class GameRealtimeService {
  private readonly logger = new Logger(GameRealtimeService.name);
  private readonly activeSessions = new Map<string, GameSession>();

  async createSession(
    gameId: string,
    hostId: string,
    maxPlayers: number = 2,
  ): Promise<GameSession> {
    const { randomUUID } = await import('crypto');

    const session: GameSession = {
      id: randomUUID(),
      gameId,
      hostId,
      players: [hostId],
      status: 'waiting',
      maxPlayers,
      state: {},
      createdAt: new Date(),
    };

    this.activeSessions.set(session.id, session);
    this.logger.log(`Game session created: ${session.id} (${gameId}) by ${hostId}`);
    return session;
  }

  async joinSession(sessionId: string, playerId: string): Promise<GameSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.players.length >= session.maxPlayers) throw new Error('Session is full');
    if (session.players.includes(playerId)) throw new Error('Already in session');
    if (session.status !== 'waiting') throw new Error('Cannot join session in progress');

    session.players.push(playerId);
    this.logger.log(`Player ${playerId} joined session ${sessionId}`);
    return session;
  }

  async leaveSession(sessionId: string, playerId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.players = session.players.filter((p) => p !== playerId);

    if (session.players.length === 0) {
      session.status = 'cancelled';
      session.endedAt = new Date();
      this.activeSessions.delete(sessionId);
    } else if (session.hostId === playerId) {
      session.hostId = session.players[0];
    }

    this.logger.log(`Player ${playerId} left session ${sessionId}`);
  }

  async startSession(sessionId: string): Promise<GameSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.players.length < 2) throw new Error('Need at least 2 players to start');

    session.status = 'in_progress';
    session.startedAt = new Date();
    this.logger.log(`Session ${sessionId} started with ${session.players.length} players`);
    return session;
  }

  async updateState(sessionId: string, playerId: string, stateUpdate: Record<string, unknown>): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    if (!session.players.includes(playerId)) return;
    session.state = { ...session.state, ...stateUpdate };
  }

  getPlayerSession(playerId: string): GameSession | undefined {
    for (const session of this.activeSessions.values()) {
      if (session.players.includes(playerId)) return session;
    }
    return undefined;
  }

  getGameSessions(gameId: string): GameSession[] {
    return Array.from(this.activeSessions.values()).filter(
      (s) => s.gameId === gameId && s.status !== 'cancelled',
    );
  }
}
