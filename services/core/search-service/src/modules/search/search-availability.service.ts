import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

// ============================================================================
// Search Availability Service (TAA §38)
// ============================================================================

export interface AvailabilityFilter {
  /** Filter by content status */
  statuses?: string[];
  /** Filter by release window */
  includeUnreleased?: boolean;
  /** Filter by geo-restrictions */
  allowedCountries?: string[];
  /** Filter by age restrictions */
  minAge?: number;
  /** Filter by content rating */
  allowedRatings?: string[];
}

export interface AvailabilityCheckResult {
  /** Whether the content is available */
  available: boolean;
  /** Reason if not available */
  reason?: string;
  /** Available regions (if geo-restricted) */
  availableRegions?: string[];
  /** Age requirement (if restricted) */
  ageRequirement?: number;
  /** Content rating */
  contentRating?: string;
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
    filters: AvailabilityFilter
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
    filters: AvailabilityFilter
  ): Promise<AvailabilityCheckResult> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        status: true,
        releaseDate: true,
        windowEndDate: true,
        allowedCountries: true,
        blockedCountries: true,
        contentRating: true,
        minAge: true,
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

    // Check release window
    if (content.releaseDate && content.releaseDate > new Date()) {
      if (!filters.includeUnreleased) {
        return {
          available: false,
          reason: 'Content is not yet released',
        };
      }
    }

    // Check window end date
    if (content.windowEndDate && content.windowEndDate < new Date()) {
      return {
        available: false,
        reason: 'Content window has ended',
      };
    }

    // Check geo-restrictions
    if (filters.allowedCountries && filters.allowedCountries.length > 0) {
      if (content.blockedCountries && content.blockedCountries.length > 0) {
        const isBlocked = filters.allowedCountries.some((country) =>
          content.blockedCountries.includes(country)
        );
        if (isBlocked) {
          return {
            available: false,
            reason: 'Content is geo-restricted in your region',
            availableRegions: content.allowedCountries,
          };
        }
      }

      if (content.allowedCountries && content.allowedCountries.length > 0) {
        const isAllowed = filters.allowedCountries.some((country) =>
          content.allowedCountries.includes(country)
        );
        if (!isAllowed) {
          return {
            available: false,
            reason: 'Content is not available in your region',
            availableRegions: content.allowedCountries,
          };
        }
      }
    }

    // Check age restrictions
    if (filters.minAge !== undefined && content.minAge !== null) {
      if (filters.minAge < content.minAge) {
        return {
          available: false,
          reason: `Content requires age ${content.minAge}+`,
          ageRequirement: content.minAge,
          contentRating: content.contentRating || undefined,
        };
      }
    }

    // Check content rating
    if (filters.allowedRatings && filters.allowedRatings.length > 0) {
      if (content.contentRating && !filters.allowedRatings.includes(content.contentRating)) {
        return {
          available: false,
          reason: `Content rating '${content.contentRating}' is not allowed`,
          contentRating: content.contentRating,
        };
      }
    }

    return {
      available: true,
      availableRegions: content.allowedCountries,
      ageRequirement: content.minAge || undefined,
      contentRating: content.contentRating || undefined,
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
      `Zero-result search: "${telemetry.query}" (userId: ${telemetry.userId || 'anonymous'})`
    );

    // Store in analytics (implementation depends on analytics service)
    // For now, log to structured output
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
    // Basic suggestion logic - could be enhanced with ML
    const suggestions: string[] = [];

    // Try partial matches
    const partialMatches = await this.prisma.contentItem.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
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
    filters: AvailabilityFilter
  ): Promise<{ latencyMs: number; resultCount: number }> {
    const startTime = Date.now();

    // Execute search with availability filtering
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
      filters
    );

    const latencyMs = Date.now() - startTime;

    return {
      latencyMs,
      resultCount: availableIds.length,
    };
  }
}
