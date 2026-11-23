import { Injectable, Logger } from '@nestjs/common';

export interface GatewayRateLimitsResponse {
  metricsText: string;
  endpoints: Array<{
    route: string;
    callsLastMinute: number;
    blockedLastMinute: number;
    limit: number;
  }>;
}

export interface GatewayHttpResponse {
  metricsText: string;
  totals: {
    totalRequests: number;
    totalErrors: number;
    errorRatePercent: number;
  };
}

@Injectable()
export class GatewayMetricsService {
  private readonly logger = new Logger(GatewayMetricsService.name);
  private readonly gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3013';

  async scrapeGatewayMetrics(): Promise<string> {
    try {
      const res = await fetch(`${this.gatewayUrl}/metrics`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        throw new Error(`Gateway returned HTTP ${res.status}`);
      }
      return await res.text();
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to scrape metrics from ${this.gatewayUrl}: ${(err as Error).message}`
      );
      return '# API Gateway metrics unreachable';
    }
  }

  async getGatewayHttp(): Promise<GatewayHttpResponse> {
    const raw = await this.scrapeGatewayMetrics();
    let totalRequests = 0;
    let totalErrors = 0;

    const requestMatches = raw.matchAll(/http_requests_total\{.*?status="(\d+)".*?\}\s+(\d+)/g);
    for (const match of requestMatches) {
      const count = Number(match[2] ?? 0);
      const status = Number(match[1] ?? 200);
      totalRequests += count;
      if (status >= 400) {
        totalErrors += count;
      }
    }

    const errorRatePercent =
      totalRequests > 0 ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0;

    return {
      metricsText: raw,
      totals: {
        totalRequests,
        totalErrors,
        errorRatePercent,
      },
    };
  }

  async getGatewayRateLimits(): Promise<GatewayRateLimitsResponse> {
    const raw = await this.scrapeGatewayMetrics();
    const endpoints: GatewayRateLimitsResponse['endpoints'] = [];

    const rateLimitMatches = raw.matchAll(
      /rate_limit_hits_total\{.*?route="([^"]+)".*?\}\s+(\d+)/g
    );
    for (const match of rateLimitMatches) {
      endpoints.push({
        route: match[1] ?? 'unknown',
        callsLastMinute: Number(match[2] ?? 0),
        blockedLastMinute: 0,
        limit: 100,
      });
    }

    return {
      metricsText: raw,
      endpoints,
    };
  }
}
