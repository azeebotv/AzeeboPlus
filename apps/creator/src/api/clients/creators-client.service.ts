import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';

export interface CreatorsServiceResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/** Challenge shape from creator-service GET /v1/creators/challenges */
export interface CreatorChallenge {
  id: string;
  title: string;
  description?: string;
  prize?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  creator?: { id: string; userId: string };
  _count?: { entries: number };
}

export interface CreatorChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  contentUrl?: string;
  status?: string;
  createdAt?: string;
  /** Prize rides the embedded challenge (getMyChallenges includes it). */
  challenge?: { prize?: string | number | null } | null;
}

@Injectable()
export class CreatorsClientService {
  private readonly creatorsServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    // Service-to-service calls go DIRECTLY to creator-service (like the wallet
    // client): the gateway exposes /api/v1/* and requires a user Bearer token,
    // which a backend caller doesn't have. Internal routes trust x-user-*
    // headers stamped with the shared gateway secret.
    const url =
      this.configService.get<string>('CREATOR_SERVICE_URL') ||
      this.configService.get<string>('API_GATEWAY_URL');
    if (!url && process.env.NODE_ENV === 'production') {
      throw new Error('CREATOR_SERVICE_URL environment variable must be set in production');
    }
    this.creatorsServiceUrl = url || 'http://localhost:3018';
    this.internalApiKey =
      this.configService.get<string>('GATEWAY_SECRET') ??
      this.configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; body?: unknown; userId?: string } = {}
  ): Promise<CreatorsServiceResponse<T>> {
    const url = `${this.creatorsServiceUrl}${endpoint}`;
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    return new Promise((resolve, reject) => {
      const req = protocol.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-gateway-secret': this.internalApiKey,
            // Forward the real end-user identity when known (challenge
            // attribution), falling back to the service identity.
            'x-user-id': options.userId || 'service',
            'x-user-role': options.userId ? 'creator' : 'service',
          },
          signal: controller.signal as AbortSignal,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            clearTimeout(timeout);
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch {
              reject(
                new HttpException('Invalid response from Creator Service', HttpStatus.BAD_GATEWAY)
              );
            }
          });
        }
      );

      req.on('error', (error) => {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
          reject(
            new HttpException('Creator Service request timed out', HttpStatus.GATEWAY_TIMEOUT)
          );
        } else {
          reject(
            new HttpException(
              `Creator Service error: ${(error as Error).message}`,
              HttpStatus.SERVICE_UNAVAILABLE
            )
          );
        }
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  /** Active challenges for the Challenges page (creator-service GET /v1/creators/challenges). */
  async getChallenges(): Promise<CreatorsServiceResponse<{ challenges: CreatorChallenge[] }>> {
    return this.request<{ challenges: CreatorChallenge[] }>('/v1/creators/challenges');
  }

  /** My submissions: challenge entries where I am a participant (creator-service GET /v1/creators/challenges/my). */
  async getMyChallengeEntries(
    userId: string
  ): Promise<CreatorsServiceResponse<{ challenges: CreatorChallengeEntry[] }>> {
    return this.request<{ challenges: CreatorChallengeEntry[] }>('/v1/creators/challenges/my', {
      userId,
    });
  }

  /** Participate in a challenge (creator-service POST /v1/creators/challenges/:id/participate). */
  async participateInChallenge(
    userId: string,
    challengeId: string,
    contentUrl: string
  ): Promise<CreatorsServiceResponse<{ entryId: string; message?: string }>> {
    return this.request<{ entryId: string; message?: string }>(
      `/v1/creators/challenges/${challengeId}/participate`,
      { method: 'POST', body: { contentUrl }, userId }
    );
  }

  /** Ranked entries for a challenge (creator-service GET /v1/creators/challenges/:id/leaderboard). */
  async getChallengeLeaderboard(challengeId: string): Promise<
    CreatorsServiceResponse<{
      challenge: { id: string; title: string; prize?: number; endDate?: string };
      totalEntries: number;
      entries: {
        position: number;
        entryId: string;
        userId: string;
        displayName: string;
        status: string;
        reviewedAt?: string | null;
        contentUrl?: string;
        submittedAt: string;
      }[];
    }>
  > {
    return this.request(`/v1/creators/challenges/${challengeId}/leaderboard`);
  }
}
