import { Injectable, OnModuleDestroy } from '@nestjs/common';
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
export class SearchIntelligenceService implements OnModuleDestroy {
  private readonly zeroResultBuffer: ZeroResultEvent[] = [];
  private readonly BUFFER_FLUSH_INTERVAL = 60_000;
  /**
   * Held so it can be released. A discarded interval handle keeps the event
   * loop alive forever: any process that boots this module (and every test
   * that compiles the graph) hangs on exit instead of finishing. `unref()`
   * means the timer never holds the process open, and `onModuleDestroy` stops
   * it outright when the app shuts down.
   */
  private readonly flushTimer: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {
    // `lib: DOM` declares setInterval as returning number; at runtime under Node
    // it is a Timeout, which is what `unref`/`clearInterval` expect here.
    this.flushTimer = setInterval(
      () => this.flushZeroResultBuffer(),
      this.BUFFER_FLUSH_INTERVAL
    ) as unknown as NodeJS.Timeout;
    this.flushTimer.unref?.();
  }

  onModuleDestroy(): void {
    clearInterval(this.flushTimer);
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
      await this.prisma.searchQueryLog.createMany({
        data: events.map((event) => ({
          query: event.query,
          userId: event.userId,
          resultCount: event.resultCount,
          createdAt: event.timestamp,
        })),
      });
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
