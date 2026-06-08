import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';

export interface ContentServiceResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl: string;
  universeId: string;
  creatorId: string;
  status: string;
  viewCount: number;
  metadata: Record<string, unknown>;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  releaseDate: Date;
  theatricalReleaseDate: Date;
  streamingReleaseDate: Date;
  windowEndDate: Date;
  windowType: string;
  isExclusive: boolean;
  isPremiere: boolean;
}

export interface ContentStats {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  pendingContent: number;
  totalViews: number;
  totalWatchTime: number;
}

@Injectable()
export class ContentClientService {
  private readonly contentServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('CONTENT_SERVICE_URL');
    if (!url && process.env.NODE_ENV === 'production') {
      throw new Error('CONTENT_SERVICE_URL environment variable must be set in production');
    }
    this.contentServiceUrl = url || 'http://localhost:3004';
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
  ): Promise<ContentServiceResponse<T>> {
    const url = `${this.contentServiceUrl}${endpoint}`;
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      const req = protocol.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (error) {
              reject(
                new HttpException('Invalid response from Content Service', HttpStatus.BAD_GATEWAY)
              );
            }
          });
        }
      );

      req.on('error', (error) => {
        reject(
          new HttpException(
            `Content Service error: ${error.message}`,
            HttpStatus.SERVICE_UNAVAILABLE
          )
        );
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async getContentItems(
    creatorId: string,
    page = 1,
    limit = 20,
    status?: string
  ): Promise<ContentServiceResponse<{ items: ContentItem[]; total: number }>> {
    const endpoint = `/api/content/creator/${creatorId}?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
    return this.request<{ items: ContentItem[]; total: number }>(endpoint);
  }

  async getContentItemById(contentId: string): Promise<ContentServiceResponse<ContentItem>> {
    const endpoint = `/api/content/${contentId}`;
    return this.request<ContentItem>(endpoint);
  }

  async createContentItem(
    data: Partial<ContentItem>
  ): Promise<ContentServiceResponse<ContentItem>> {
    const endpoint = '/api/content';
    return this.request<ContentItem>(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  async updateContentItem(
    contentId: string,
    data: Partial<ContentItem>
  ): Promise<ContentServiceResponse<ContentItem>> {
    const endpoint = `/api/content/${contentId}`;
    return this.request<ContentItem>(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteContentItem(
    contentId: string
  ): Promise<ContentServiceResponse<{ success: boolean; message: string }>> {
    const endpoint = `/api/content/${contentId}`;
    return this.request<{ success: boolean; message: string }>(endpoint, {
      method: 'DELETE',
    });
  }

  async getContentStats(creatorId: string): Promise<ContentServiceResponse<ContentStats>> {
    const endpoint = `/api/content/creator/${creatorId}/stats`;
    return this.request<ContentStats>(endpoint);
  }

  async getContentAnalytics(
    creatorId: string,
    startDate: string,
    endDate: string
  ): Promise<ContentServiceResponse<Record<string, unknown>>> {
    const endpoint = `/api/content/creator/${creatorId}/analytics?startDate=${startDate}&endDate=${endDate}`;
    return this.request<Record<string, unknown>>(endpoint);
  }
}
