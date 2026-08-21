import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  score: number;
  available: boolean;
  availabilityReason?: string;
}

export interface ZeroResultEvent {
  query: string;
  userId?: string;
  region?: string;
  timestamp: Date;
  resultCount: number;
  filters?: Record<string, unknown>;
}

export interface SearchQualityMetrics {
  totalQueries: number;
  zeroResultQueries: number;
  zeroResultRate: number;
  topZeroResultQueries: Array<{ query: string; count: number }>;
  avgResultCount: number;
}

@Injectable()
export class SearchIntelligenceService {
  private readonly zeroResultBuffer: ZeroResultEvent[] = [];
  private readonly BUFFER_FLUSH_INTERVAL = 60_000;

  constructor(private readonly prisma: PrismaService) {
    setInterval(() => this.flushZeroResultBuffer(), this.BUFFER_FLUSH_INTERVAL);
  }

  /**
   * Filter and rank results by availability (AZP-SEARCH-003).
   * Uses content status as the primary availability signal.
   */
  async filterByAvailability(results: SearchResult[], _userId?: string): Promise<SearchResult[]> {
    const contentIds = results.map((r) => r.id);
    const contentItems = await this.prisma.contentItem.findMany({
      where: { id: { in: contentIds } },
      select: { id: true, status: true },
    });

    const contentMap = new Map(contentItems.map((c) => [c.id, c.status]));

    return results.map((result) => {
      const status = contentMap.get(result.id);

      if (!status) {
        return { ...result, available: false, availabilityReason: 'not_found' };
      }

      if (status !== 'published') {
        return {
          ...result,
          available: false,
          availabilityReason: 'not_published',
          score: result.score * 0.1,
        };
      }

      return { ...result, available: true };
    });
  }

  trackZeroResult(event: Omit<ZeroResultEvent, 'timestamp'>): void {
    this.zeroResultBuffer.push({
      ...event,
      timestamp: new Date(),
    });
  }

  private async flushZeroResultBuffer(): Promise<void> {
    if (this.zeroResultBuffer.length === 0) return;

    const events = [...this.zeroResultBuffer];
    this.zeroResultBuffer.length = 0;

    try {
      for (const event of events) {
        await this.prisma.searchQueryLog.create({
          data: {
            query: event.query,
            userId: event.userId,
            resultCount: event.resultCount,
            createdAt: event.timestamp,
          },
        });
      }
    } catch {
      this.zeroResultBuffer.unshift(...events);
    }
  }

  async getSearchQualityMetrics(_days: number = 7): Promise<SearchQualityMetrics> {
    return {
      totalQueries: 0,
      zeroResultQueries: 0,
      zeroResultRate: 0,
      topZeroResultQueries: [],
      avgResultCount: 0,
    };
  }

  async getRankedSuggestions(
    _query: string,
    _limit: number = 10
  ): Promise<Array<{ suggestion: string; score: number }>> {
    return [];
  }
}
