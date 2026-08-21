import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

// ============================================================================
// Search Availability Service (TAA §38)
// ============================================================================

export interface AvailabilityFilter {
  /** Filter by content status */
  statuses?: string[];
  /** Filter by content type */
  contentTypes?: string[];
  /** Filter by universe */
  universes?: string[];
  /** Filter by categories */
  categories?: string[];
}

export interface AvailabilityCheckResult {
  /** Whether the content is available */
  available: boolean;
  /** Reason if not available */
  reason?: string;
}

export interface ZeroResultTelemetry {
  query: string;
  userId?: string;
  timestamp: Date;
  universeId?: string;
  filters?: AvailabilityFilter;
  resultCount: number;
  suggestions?: string[];
}

@Injectable()
export class SearchAvailabilityService {
  private readonly logger = new Logger(SearchAvailabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // Availability Filtering (TAA §38)
  // ============================================================================

  /**
   * Filter search results to only include available content.
   * Results never return unavailable content (TAA §38).
   */
  async filterAvailableContent(
    contentIds: string[],
    filters: AvailabilityFilter,
  ): Promise<string[]> {
    const availableIds: string[] = [];

    for (const id of contentIds) {
      const availability = await this.checkContentAvailability(id, filters);
      if (availability.available) {
        availableIds.push(id);
      }
    }

    return availableIds;
  }

  /**
   * Check if specific content is available
   */
  async checkContentAvailability(
    contentId: string,
    filters: AvailabilityFilter,
  ): Promise<AvailabilityCheckResult> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        status: true,
        contentType: true,
        universe: true,
        categories: true,
      },
    });

    if (!content) {
      return {
        available: false,
        reason: 'Content not found',
      };
    }

    // Check status
    const defaultStatuses = ['published'];
    const allowedStatuses = filters.statuses || defaultStatuses;
    if (!allowedStatuses.includes(content.status)) {
      return {
        available: false,
        reason: `Content status '${content.status}' is not in allowed statuses`,
      };
    }

    // Check content type
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      if (!filters.contentTypes.includes(content.contentType)) {
        return {
          available: false,
          reason: `Content type '${content.contentType}' is not in allowed types`,
        };
      }
    }

    // Check universe
    if (filters.universes && filters.universes.length > 0) {
      if (!filters.universes.includes(content.universe)) {
        return {
          available: false,
          reason: `Content universe '${content.universe}' is not in allowed universes`,
        };
      }
    }

    // Check categories
    if (filters.categories && filters.categories.length > 0) {
      const hasMatchingCategory = content.categories.some((cat) =>
        filters.categories!.includes(cat),
      );
      if (!hasMatchingCategory) {
        return {
          available: false,
          reason: 'Content does not match any allowed categories',
        };
      }
    }

    return {
      available: true,
    };
  }

  // ============================================================================
  // Zero-Result Telemetry (AZP-SEARCH-002)
  // ============================================================================

  /**
   * Track zero-result searches for telemetry
   */
  async trackZeroResult(telemetry: ZeroResultTelemetry): Promise<void> {
    this.logger.log(
      `Zero-result search: "${telemetry.query}" (userId: ${telemetry.userId || 'anonymous'})`,
    );

    const logEntry = {
      event: 'search_zero_result',
      query: telemetry.query,
      userId: telemetry.userId,
      timestamp: telemetry.timestamp.toISOString(),
      universeId: telemetry.universeId,
      filters: telemetry.filters,
      resultCount: telemetry.resultCount,
      suggestions: telemetry.suggestions,
    };

    this.logger.log(JSON.stringify(logEntry));
  }

  /**
   * Generate search suggestions for zero-result queries
   */
  async generateSuggestions(query: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Try partial matches on title
    const partialMatches = await this.prisma.contentItem.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
      },
      select: { title: true },
      take: 5,
    });

    suggestions.push(...partialMatches.map((m) => m.title));

    // Try similar terms
    const words = query.toLowerCase().split(' ');
    for (const word of words) {
      if (word.length > 3) {
        const similar = await this.prisma.contentItem.findMany({
          where: {
            title: { contains: word, mode: 'insensitive' },
          },
          select: { title: true },
          take: 3,
        });
        suggestions.push(...similar.map((s) => s.title));
      }
    }

    // Deduplicate
    return [...new Set(suggestions)].slice(0, 10);
  }

  // ============================================================================
  // Search P95 Measurement (AZP-NFR-004)
  // ============================================================================

  /**
   * Measure search latency
   */
  async measureSearchLatency(
    query: string,
    filters: AvailabilityFilter,
  ): Promise<{ latencyMs: number; resultCount: number }> {
    const startTime = Date.now();

    // Execute search
    const results = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        title: { contains: query, mode: 'insensitive' },
      },
      select: { id: true },
    });

    // Apply availability filters
    const availableIds = await this.filterAvailableContent(
      results.map((r) => r.id),
      filters,
    );

    const latencyMs = Date.now() - startTime;

    return {
      latencyMs,
      resultCount: availableIds.length,
    };
  }
}
