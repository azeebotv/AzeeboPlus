import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Licensed/Authoritative Sports Data Sourcing (TAA §69)
 *
 * Integrates with external sports data providers for:
 * - Live scores and match data
 * - Fixture schedules
 * - Player/team statistics
 * - Odds data for predictions
 *
 * Supports multiple providers with fallback for resilience.
 */

export interface SportsDataProvider {
  name: string;
  baseUrl: string;
  apiKey: string;
  priority: number;
}

export interface LiveScore {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed';
  minute?: number;
  period?: string;
  lastUpdated: Date;
}

export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  league: string;
  venue?: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
}

@Injectable()
export class SportsDataSourcingService {
  private readonly logger = new Logger(SportsDataSourcingService.name);
  private readonly providers: SportsDataProvider[];

  constructor(private readonly configService: ConfigService) {
    this.providers = [
      {
        name: 'primary',
        baseUrl: this.configService.get<string>('SPORTS_API_PRIMARY_URL', ''),
        apiKey: this.configService.get<string>('SPORTS_API_PRIMARY_KEY', ''),
        priority: 1,
      },
      {
        name: 'secondary',
        baseUrl: this.configService.get<string>('SPORTS_API_SECONDARY_URL', ''),
        apiKey: this.configService.get<string>('SPORTS_API_SECONDARY_KEY', ''),
        priority: 2,
      },
    ].filter((p) => p.baseUrl && p.apiKey);
  }

  /**
   * Fetch live scores with provider fallback.
   */
  async getLiveScores(league?: string): Promise<LiveScore[]> {
    for (const provider of this.getProvidersByPriority()) {
      try {
        const scores = await this.fetchFromProvider<LiveScore[]>(provider, '/live', { league });
        if (scores) return scores;
      } catch (error) {
        this.logger.warn(
          `Provider ${provider.name} failed for live scores: ${(error as Error).message}`
        );
      }
    }

    this.logger.error('All sports data providers failed for live scores');
    return [];
  }

  /**
   * Fetch fixtures with provider fallback.
   */
  async getFixtures(params: {
    league?: string;
    date?: string;
    upcoming?: boolean;
  }): Promise<Fixture[]> {
    for (const provider of this.getProvidersByPriority()) {
      try {
        const fixtures = await this.fetchFromProvider<Fixture[]>(provider, '/fixtures', params);
        if (fixtures) return fixtures;
      } catch (error) {
        this.logger.warn(
          `Provider ${provider.name} failed for fixtures: ${(error as Error).message}`
        );
      }
    }

    return [];
  }

  /**
   * Get match details by ID.
   */
  async getMatchDetails(matchId: string): Promise<Record<string, unknown> | null> {
    for (const provider of this.getProvidersByPriority()) {
      try {
        const match = await this.fetchFromProvider<Record<string, unknown>>(
          provider,
          `/matches/${matchId}`
        );
        if (match) return match;
      } catch (error) {
        this.logger.warn(
          `Provider ${provider.name} failed for match ${matchId}: ${(error as Error).message}`
        );
      }
    }

    return null;
  }

  private async fetchFromProvider<T>(
    provider: SportsDataProvider,
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T | null> {
    const response = await axios.get(`${provider.baseUrl}${endpoint}`, {
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
      },
      params,
      timeout: 5000,
    });

    return response.data as T;
  }

  private getProvidersByPriority(): SportsDataProvider[] {
    return [...this.providers].sort((a, b) => a.priority - b.priority);
  }
}
