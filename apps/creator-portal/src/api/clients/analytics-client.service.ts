import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';

export interface AnalyticsServiceResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventName: string;
  eventData: Record<string, unknown>;
  timestamp: Date;
}

export interface ContentAnalytics {
  contentId: string;
  title: string;
  viewCount: number;
  watchTime: number;
  completionRate: number;
  averageWatchTime: number;
  engagementRate: number;
  createdAt: Date;
}

export interface UserAnalytics {
  userId: string;
  displayName: string;
  avatar: string;
  watchCount: number;
  totalWatchTime: number;
  lastActive: Date;
  engagementScore: number;
}

export interface CreatorAnalytics {
  totalViews: number;
  totalWatchTime: number;
  totalUsers: number;
  averageWatchTime: number;
  completionRate: number;
  engagementRate: number;
  revenue: number;
  growthRate: number;
}

@Injectable()
export class AnalyticsClientService {
  private readonly analyticsServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.analyticsServiceUrl =
      this.configService.get<string>('API_GATEWAY_URL') || 'http://localhost:3013';
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
  ): Promise<AnalyticsServiceResponse<T>> {
    const url = `${this.analyticsServiceUrl}${endpoint}`;
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
                new HttpException('Invalid response from Analytics Service', HttpStatus.BAD_GATEWAY)
              );
            }
          });
        }
      );

      req.on('error', (error) => {
        reject(
          new HttpException(
            `Analytics Service error: ${(error as Error).message}`,
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

  async getCreatorAnalytics(
    creatorId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsServiceResponse<CreatorAnalytics>> {
    const endpoint = `/v1/analytics/creator/${creatorId}?startDate=${startDate}&endDate=${endDate}`;
    return this.request<CreatorAnalytics>(endpoint);
  }

  async getContentAnalytics(
    contentId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsServiceResponse<ContentAnalytics>> {
    const endpoint = `/v1/analytics/content/${contentId}?startDate=${startDate}&endDate=${endDate}`;
    return this.request<ContentAnalytics>(endpoint);
  }

  async getTopContent(
    creatorId: string,
    limit = 10
  ): Promise<AnalyticsServiceResponse<ContentAnalytics[]>> {
    const endpoint = `/v1/analytics/creator/${creatorId}/top-content?limit=${limit}`;
    return this.request<ContentAnalytics[]>(endpoint);
  }

  async getTopUsers(
    creatorId: string,
    limit = 10
  ): Promise<AnalyticsServiceResponse<UserAnalytics[]>> {
    const endpoint = `/v1/analytics/creator/${creatorId}/top-users?limit=${limit}`;
    return this.request<UserAnalytics[]>(endpoint);
  }

  async getAudienceDemographics(creatorId: string): Promise<
    AnalyticsServiceResponse<{
      ageDistribution: Record<string, number>;
      genderDistribution: Record<string, number>;
      locationDistribution: Record<string, number>;
      deviceDistribution: Record<string, number>;
    }>
  > {
    const endpoint = `/v1/analytics/creator/${creatorId}/demographics`;
    return this.request<{
      ageDistribution: Record<string, number>;
      genderDistribution: Record<string, number>;
      locationDistribution: Record<string, number>;
      deviceDistribution: Record<string, number>;
    }>(endpoint);
  }

  async getEngagementTrends(
    creatorId: string,
    days = 30
  ): Promise<
    AnalyticsServiceResponse<
      {
        date: string;
        views: number;
        watchTime: number;
        engagementRate: number;
      }[]
    >
  > {
    const endpoint = `/v1/analytics/creator/${creatorId}/engagement?days=${days}`;
    return this.request<
      {
        date: string;
        views: number;
        watchTime: number;
        engagementRate: number;
      }[]
    >(endpoint);
  }

  async getRevenueAnalytics(
    creatorId: string,
    startDate: string,
    endDate: string
  ): Promise<
    AnalyticsServiceResponse<{
      totalRevenue: number;
      revenueByContent: Array<{
        contentId: string;
        title: string;
        revenue: number;
      }>;
      revenueTrends: Array<{
        date: string;
        revenue: number;
      }>;
    }>
  > {
    const endpoint = `/v1/analytics/creator/${creatorId}/revenue?startDate=${startDate}&endDate=${endDate}`;
    return this.request<{
      totalRevenue: number;
      revenueByContent: Array<{
        contentId: string;
        title: string;
        revenue: number;
      }>;
      revenueTrends: Array<{
        date: string;
        revenue: number;
      }>;
    }>(endpoint);
  }

  async trackEvent(
    userId: string,
    eventName: string,
    eventData: Record<string, unknown>
  ): Promise<AnalyticsServiceResponse<{ success: boolean; eventId: string }>> {
    const endpoint = '/v1/analytics/events';
    return this.request<{ success: boolean; eventId: string }>(endpoint, {
      method: 'POST',
      body: {
        userId,
        eventName,
        eventData,
      },
    });
  }
}
