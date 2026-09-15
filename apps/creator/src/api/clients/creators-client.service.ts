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
}

@Injectable()
export class CreatorsClientService {
  private readonly creatorsServiceUrl: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const url = this.configService.get<string>('API_GATEWAY_URL');
    if (!url && process.env.NODE_ENV === 'production') {
      throw new Error('API_GATEWAY_URL environment variable must be set in production');
    }
    this.creatorsServiceUrl = url || 'http://localhost:3013';
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; body?: unknown } = {}
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
          reject(new HttpException('Creator Service request timed out', HttpStatus.GATEWAY_TIMEOUT));
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

  /** My submissions: entries where I am a participant. */
  async getMyChallengeEntries(_userId: string): Promise<CreatorsServiceResponse<{ challenges: CreatorChallenge[] }>> {
    return this.request<{ challenges: CreatorChallenge[] }>('/v1/creators/challenges');
  }

  /** Participate in a challenge (creator-service POST /v1/creators/challenges/:id/participate). */
  async participateInChallenge(
    _userId: string,
    challengeId: string,
    contentUrl: string
  ): Promise<CreatorsServiceResponse<{ success: boolean; data: unknown }>> {
    return this.request<{ success: boolean; data: unknown }>(
      `/v1/creators/challenges/${challengeId}/participate`,
      { method: 'POST', body: { contentUrl } }
    );
  }
}
