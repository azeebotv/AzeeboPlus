import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface CreatePartyDto {
  contentId: string;
  title?: string;
  maxParticipants?: number;
}

export interface JoinPartyDto {
  inviteCode: string;
}

export interface PartyState {
  id: string;
  contentId: string;
  hostId: string;
  title: string;
  inviteCode: string;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  currentTime: number;
  isSyncing: boolean;
  maxParticipants: number;
  participantCount: number;
  participants: PartyParticipant[];
  createdAt: Date;
}

export interface PartyParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  role: 'host' | 'co-host' | 'member';
  isMuted: boolean;
  joinedAt: Date;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  updatedAt: Date;
  updatedBy: string;
}

export interface ChatMessage {
  id: string;
  partyId: string;
  userId: string;
  userName: string;
  content: string;
  type: 'text' | 'system' | 'reaction';
  createdAt: Date;
}

@Injectable()
export class WatchPartyService {
  private readonly logger = new Logger(WatchPartyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a watch party
   */
  async createParty(userId: string, dto: CreatePartyDto): Promise<PartyState> {
    // Generate unique invite code
    const inviteCode = this.generateInviteCode();

    // Check if user already has an active party for this content
    const existing = await this.prisma.watchParty.findFirst({
      where: {
        hostId: userId,
        contentId: dto.contentId,
        status: { in: ['waiting', 'playing', 'paused'] },
      },
    });

    if (existing) {
      throw new BadRequestException('You already have an active party for this content');
    }

    const party = await this.prisma.watchParty.create({
      data: {
        contentId: dto.contentId,
        hostId: userId,
        title: dto.title || `Watch Party`,
        inviteCode,
        status: 'waiting',
        currentTime: 0,
        maxParticipants: dto.maxParticipants || 20,
        participants: {
          create: {
            userId,
            role: 'host',
            displayName: 'Host',
          },
        },
      },
      include: { participants: true },
    });

    this.logger.log(`Watch party created: ${party.id} by ${userId}`);

    return this.formatParty(party);
  }

  /**
   * Join a watch party
   */
  async joinParty(userId: string, inviteCode: string): Promise<PartyState> {
    const party = await this.prisma.watchParty.findUnique({
      where: { inviteCode },
      include: { participants: true },
    });

    if (!party) {
      throw new NotFoundException('Party not found');
    }

    if (party.status === 'ended') {
      throw new BadRequestException('This party has ended');
    }

    if (party.participants.length >= party.maxParticipants) {
      throw new BadRequestException('Party is full');
    }

    // Check if already in party
    const existingParticipant = party.participants.find((p) => p.userId === userId);
    if (existingParticipant) {
      return this.formatParty(party);
    }

    await this.prisma.partyParticipant.create({
      data: {
        partyId: party.id,
        userId,
        role: 'member',
        displayName: 'Member',
      },
    });

    // Add system message
    await this.addSystemMessage(party.id, 'A new member joined the party!');

    this.logger.log(`User ${userId} joined party ${party.id}`);

    const updated = await this.prisma.watchParty.findUnique({
      where: { id: party.id },
      include: { participants: true },
    });

    return this.formatParty(updated!);
  }

  /**
   * Leave a watch party
   */
  async leaveParty(userId: string, partyId: string): Promise<void> {
    const participant = await this.prisma.partyParticipant.findUnique({
      where: {
        partyId_userId: { partyId, userId },
      },
    });

    if (!participant) throw new NotFoundException('Not in this party');

    // If host leaves, end the party
    if (participant.role === 'host') {
      await this.endParty(userId, partyId);
      return;
    }

    await this.prisma.partyParticipant.delete({ where: { id: participant.id } });
    await this.addSystemMessage(partyId, 'A member left the party');
  }

  /**
   * End a watch party (host only)
   */
  async endParty(userId: string, partyId: string): Promise<void> {
    const party = await this.prisma.watchParty.findUnique({ where: { id: partyId } });
    if (!party) throw new NotFoundException('Party not found');
    if (party.hostId !== userId) throw new ForbiddenException('Only host can end party');

    await this.prisma.watchParty.update({
      where: { id: partyId },
      data: { status: 'ended' },
    });

    await this.addSystemMessage(partyId, 'Party has ended');
    this.logger.log(`Party ended: ${partyId}`);
  }

  /**
   * Update playback state (host only)
   */
  async updatePlayback(
    userId: string,
    partyId: string,
    state: Partial<PlaybackState>
  ): Promise<PlaybackState> {
    const party = await this.prisma.watchParty.findUnique({ where: { id: partyId } });
    if (!party) throw new NotFoundException('Party not found');

    const participant = await this.prisma.partyParticipant.findUnique({
      where: {
        partyId_userId: { partyId, userId },
      },
    });
    if (!participant) throw new ForbiddenException('Not in this party');
    if (participant.role !== 'host' && participant.role !== 'co-host') {
      throw new ForbiddenException('Only host/co-host can control playback');
    }

    const updateData: Record<string, unknown> = {};

    if (state.isPlaying !== undefined) {
      updateData.status = state.isPlaying ? 'playing' : 'paused';
    }
    if (state.currentTime !== undefined) {
      updateData.currentTime = state.currentTime;
    }

    await this.prisma.watchParty.update({
      where: { id: partyId },
      data: updateData,
    });

    const playbackState: PlaybackState = {
      isPlaying: state.isPlaying ?? party.status === 'playing',
      currentTime: state.currentTime ?? Number(party.currentTime),
      playbackRate: state.playbackRate ?? 1,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    return playbackState;
  }

  /**
   * Sync all participants to host's position
   */
  async syncParticipants(userId: string, partyId: string): Promise<void> {
    const party = await this.prisma.watchParty.findUnique({ where: { id: partyId } });
    if (!party) throw new NotFoundException('Party not found');
    if (party.hostId !== userId) throw new ForbiddenException('Only host can sync');

    await this.prisma.watchParty.update({
      where: { id: partyId },
      data: { isSyncing: true },
    });

    // Reset syncing flag after a delay
    setTimeout(async () => {
      await this.prisma.watchParty.update({
        where: { id: partyId },
        data: { isSyncing: false },
      });
    }, 2000);
  }

  /**
   * Send chat message in party
   */
  async sendChatMessage(userId: string, partyId: string, content: string): Promise<ChatMessage> {
    const participant = await this.prisma.partyParticipant.findUnique({
      where: {
        partyId_userId: { partyId, userId },
      },
    });
    if (!participant) throw new ForbiddenException('Not in this party');

    const message = await this.prisma.partyChat.create({
      data: {
        partyId,
        userId,
        userName: participant.displayName,
        content,
        type: 'text',
      },
    });

    return {
      id: message.id,
      partyId: message.partyId,
      userId: message.userId,
      userName: message.userName,
      content: message.content,
      type: message.type as ChatMessage['type'],
      createdAt: message.createdAt,
    };
  }

  /**
   * Get party chat history
   */
  async getChatHistory(partyId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await this.prisma.partyChat.findMany({
      where: { partyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map((m) => ({
      id: m.id,
      partyId: m.partyId,
      userId: m.userId,
      userName: m.userName,
      content: m.content,
      type: m.type as ChatMessage['type'],
      createdAt: m.createdAt,
    }));
  }

  /**
   * Get party by ID
   */
  async getParty(partyId: string): Promise<PartyState> {
    const party = await this.prisma.watchParty.findUnique({
      where: { id: partyId },
      include: { participants: true },
    });

    if (!party) throw new NotFoundException('Party not found');
    return this.formatParty(party);
  }

  /**
   * Get user's active parties
   */
  async getUserParties(userId: string): Promise<PartyState[]> {
    const parties = await this.prisma.watchParty.findMany({
      where: {
        participants: { some: { userId } },
        status: { in: ['waiting', 'playing', 'paused'] },
      },
      include: { participants: true },
      orderBy: { createdAt: 'desc' },
    });

    return parties.map((p) => this.formatParty(p));
  }

  /**
   * Generate invite code
   */
  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Add system message
   */
  private async addSystemMessage(partyId: string, content: string): Promise<void> {
    await this.prisma.partyChat.create({
      data: {
        partyId,
        userId: 'system',
        userName: 'System',
        content,
        type: 'system',
      },
    });
  }

  /**
   * Format party for API response
   */
  private formatParty(party: {
    id: string;
    contentId: string;
    hostId: string;
    title: string;
    inviteCode: string;
    status: string;
    currentTime: number | unknown;
    isSyncing: boolean;
    maxParticipants: number;
    participants: {
      id: string;
      userId: string;
      displayName: string;
      role: string;
      isMuted: boolean;
      joinedAt: Date;
    }[];
    createdAt: Date;
  }): PartyState {
    return {
      id: party.id,
      contentId: party.contentId,
      hostId: party.hostId,
      title: party.title,
      inviteCode: party.inviteCode,
      status: party.status as PartyState['status'],
      currentTime: Number(party.currentTime),
      isSyncing: party.isSyncing,
      maxParticipants: party.maxParticipants,
      participantCount: party.participants.length,
      participants: party.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        role: p.role as PartyParticipant['role'],
        isMuted: p.isMuted,
        joinedAt: p.joinedAt,
      })),
      createdAt: party.createdAt,
    };
  }
}
