import { Controller, Get, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Public } from '@azeebo/security';
import { FeatureFlagService } from '@azeebo/feature-flags';

interface BootstrapFlag {
  key: string;
  enabled: boolean;
  value?: string | number | boolean | null;
}

interface BootstrapResponse {
  flags: BootstrapFlag[];
  generatedAt: string;
  evaluatedFor: 'user' | 'anonymous';
}

/**
 * Client-facing flag bootstrap.
 *
 * Returns only flags marked `isPublic` (or configured as public defaults) —
 * the safe subset of feature flags the web/mobile apps may consume. Evaluation
 * is per-user: when the caller presents a valid JWT, the user id drives
 * rollout hashing and user allowlists; anonymous callers may supply a stable
 * `x-anonymous-id` header for consistent bucketing.
 *
 * Route: GET /feature-flags/bootstrap (outside the /api proxy namespace, so it
 * is served by the gateway itself rather than proxied to a microservice).
 */
@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  @Public()
  @Get('bootstrap')
  @ApiOperation({ summary: 'Get evaluated public feature flags for the caller' })
  @ApiResponse({ status: 200, description: 'Public flags evaluated for the caller' })
  async bootstrap(
    @Req() req: Request & {
      user?: { sub?: string };
      headers: Record<string, string | undefined>;
    }
  ): Promise<{ success: boolean; data: BootstrapResponse }> {
    let userId: string | undefined = req.user?.sub;

    // The endpoint is public, but when a valid token is present we still
    // resolve the user id so rollout % and user allowlists bucket consistently.
    const authHeader = req.headers['authorization'];
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      userId = this.verifyUserId(authHeader.substring(7)) ?? undefined;
    }

    const anonymousId = req.headers['x-anonymous-id'] as string | undefined;

    const flags = await this.featureFlagService.getPublicFlags(userId, anonymousId);

    return {
      success: true,
      data: {
        flags,
        generatedAt: new Date().toISOString(),
        evaluatedFor: userId ? 'user' : 'anonymous',
      },
    };
  }

  private verifyUserId(token: string): string | null {
    const jwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!jwtSecret) return null;
    try {
      const payload = jwt.verify(token, jwtSecret, {
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
        algorithms: ['HS256'],
      }) as { sub?: string };
      return payload.sub || null;
    } catch {
      return null;
    }
  }
}
