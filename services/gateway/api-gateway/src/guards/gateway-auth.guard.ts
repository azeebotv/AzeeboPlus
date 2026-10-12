import {
  Inject,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';
import { IS_PUBLIC_KEY } from '@azeebo/security';

/**
 * Gateway-level authentication guard.
 * Registered as APP_GUARD to enforce auth on ALL routes by default.
 * Routes marked with @Public() or matching PUBLIC_PATH_PATTERNS are exempt.
 *
 * Validates JWT signature and expiry from Authorization header,
 * then forwards user context to downstream services via x-user-* headers.
 */
@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAuthGuard.name);

  /**
   * Path patterns that do not require authentication.
   * Only truly public endpoints are listed here — health, auth, docs,
   * public settings, and read-only content listings.
   *
   * Creator profiles, engagement data, subscription plans, and
   * universe-specific trending require authentication for
   * personalized behavior and access control.
   */
  private static readonly PUBLIC_PATH_PATTERNS: RegExp[] = [
    // Auth endpoints (pre-login — user has no token yet)
    /^\/(api\/)?(v\d+\/)?auth\/(login|signup|register|refresh|forgot-password|reset-password|verify-email|resend-verification|social\/(google|apple)(\/authorize)?|social\/callback|otp\/(send|verify))$/,
    /^\/(api\/)?(v\d+\/)?auth\/health$/,
    // SPA cookie management: the client exchanges its freshly-issued tokens for
    // httpOnly cookies right after login and bootstraps the CSRF cookie. Both
    // must be reachable without an existing token (cookie POST carries the
    // token in its body; DELETE is the logout path).
    /^\/(api\/)?(v\d+\/)?auth\/cookie$/,
    /^\/(api\/)?(v\d+\/)?auth\/csrf$/,
    // Gateway health checks
    /^\/(health|ready|live)$/,
    // Client feature-flag bootstrap (public, per-user evaluation)
    /^\/feature-flags\/bootstrap$/,
    // Swagger UI
    /^\/docs(\/.*)?$/,
    // Public settings/universes (no user context needed)
    /^\/api\/v\d+\/public\//,
    // Public content browsing — read-only listings (no personalization)
    /^\/api\/v\d+\/content\/(home|watch|featured|trending|new-releases|featured-slides|popular-region|categories|tags)$/,
    // Content detail (read-only)
    /^\/api\/v\d+\/content\/[a-zA-Z0-9_-]+$/,
    // Content comments and related
    /^\/api\/v\d+\/content\/[a-zA-Z0-9_-]+\/(comments|related)$/,
    // Universe-specific content by slug
    /^\/api\/v\d+\/content\/universe\/[a-zA-Z0-9_-]+$/,
    /^\/api\/v\d+\/content\/category\/[a-zA-Z0-9_-]+$/,
    // Universe detail
    /^\/api\/v\d+\/universe\/[a-zA-Z0-9_-]+$/,
    // Search suggestions and trending searches
    /^\/api\/v\d+\/search\/(trending|suggestions)$/,
    // Lifestyle music — read-only listings/detail served on the public
    // /lifestyle/music browse page (writes still require auth)
    /^\/api\/v\d+\/lifestyle\/music$/,
    /^\/api\/v\d+\/lifestyle\/music\/(trending|genres)$/,
    // genre-detail & artist-detail pages (slug/id = slugified name, derived from entries)
    /^\/api\/v\d+\/lifestyle\/music\/(genres|artists)\/[a-z0-9-]+$/,
    /^\/api\/v\d+\/lifestyle\/music\/[a-z0-9-]+$/,
    // Lifestyle guides (9TLIFE) — read-only public catalogs and detail pages;
    // everything under /lifestyle/admin stays auth-gated (exact segments only).
    /^\/api\/v\d+\/lifestyle\/(itineraries|neighborhoods|partners|offers)$/,
    /^\/api\/v\d+\/lifestyle\/(itineraries|neighborhoods|partners|offers)\/[a-z0-9-]+$/,
    // Borrow page — the approved-partner catalogue is public marketing surface
    // (no personalization, no application data). /borrow/admin/* stays gated:
    // the slug segment pattern deliberately excludes 'admin'.
    /^\/api\/v\d+\/borrow\/banks$/,
    /^\/api\/v\d+\/borrow\/banks\/[a-z0-9-]+$/,
    // Participation result page (writes — votes, quiz submits — still require auth)
    /^\/api\/v\d+\/participation\/[a-z0-9-]+\/result$/,
    // Participation hub + detail pages — read-only listings (votes/quiz attempts
    // and challenge submissions remain auth-gated on the same services)
    /^\/api\/v\d+\/(polls|quizzes|challenges)$/,
    /^\/api\/v\d+\/(polls|quizzes|challenges)\/[a-zA-Z0-9-]+$/,
    // Moderation report types (needed for report forms before login)
    /^\/api\/v\d+\/moderation\/report-types$/,
    // Public challenge boards — read-only leaderboard data behind the shared
    // /boards/:challengeId pages (writes and everything else stay gated)
    /^\/api\/v\d+\/creator\/boards\/[a-zA-Z0-9_-]+$/,
  ];

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    // SECURITY (AUD-01): Strip untrusted client identity headers before route processing
    delete request.headers['x-user-id'];
    delete request.headers['x-user-email'];
    delete request.headers['x-user-role'];
    delete request.headers['x-gateway-secret'];

    if (isPublic) {
      return true;
    }

    // Check if the path matches a known public pattern
    const requestPath = request.path || request.url;

    // AUD-19: Swagger docs are only public in local dev when SWAGGER_ENABLED=true
    if (requestPath.startsWith('/docs')) {
      const isLocalDev =
        process.env.NODE_ENV === 'development' || process.env.DEPLOY_ENV === 'local';
      if (!isLocalDev || process.env.SWAGGER_ENABLED !== 'true') {
        const internalKey = request.headers['x-internal-api-key'];
        const configuredKey = this.configService.get<string>('INTERNAL_API_KEY');
        // Timing-safe compare so the key check doesn't leak its value one
        // byte at a time through response timing.
        const provided = Buffer.from(typeof internalKey === 'string' ? internalKey : '');
        const expected = Buffer.from(configuredKey ?? '');
        if (
          !configuredKey ||
          provided.length !== expected.length ||
          !timingSafeEqual(provided, expected)
        ) {
          throw new UnauthorizedException('Swagger documentation is restricted');
        }
      }
      return true;
    }

    // AUD-05: Public content/lifestyle/search patterns only permit safe read-only methods
    const isPublicPath = GatewayAuthGuard.PUBLIC_PATH_PATTERNS.some((pattern) => {
      if (!pattern.test(requestPath)) return false;
      if (
        requestPath.includes('/auth/') ||
        requestPath.includes('/health') ||
        requestPath.includes('/ready') ||
        requestPath.includes('/live') ||
        requestPath.includes('/feature-flags/')
      ) {
        return true;
      }
      const method = (request.method || 'GET').toUpperCase();
      return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    });

    if (isPublicPath) {
      return true;
    }
    const authHeader = request.headers['authorization'];

    // Extract token from Authorization header or httpOnly cookie
    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    // Configuration failures are misconfiguration, not bad credentials — hoisted
    // above the try so they surface as the 500-class error they are instead of
    // being flattened into a lying 401.
    const jwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is required');
    }

    try {
      const payload = this.verifyToken(token);

      // Attach user to request for downstream use
      request.user = payload;

      // Forward user context to downstream microservices via headers
      request.headers['x-user-id'] = payload.sub;
      request.headers['x-user-email'] = payload.email;
      request.headers['x-user-role'] = payload.role || 'user';

      return true;
    } catch (error) {
      // allowed-fabricated-4xx: token verification is pure client input — every
      // failure shape (malformed, expired, wrong signature) must be
      // indistinguishable to callers (anti-enumeration), so a uniform 401 is
      // the correct answer and mapAndThrow would wrongly escalate a plain JWT
      // error to a 500. Configuration failures are no longer caught here.
      this.logger.warn(`Auth validation failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verifies JWT signature using the shared secret with auth-service.
   * Uses JWT_ACCESS_SECRET to align with auth-service configuration.
   */
  private verifyToken(token: string): {
    sub: string;
    email: string;
    role?: string;
  } {
    const jwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is required');
    }

    try {
      const payload = jwt.verify(token, jwtSecret, {
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
        algorithms: ['HS256'],
      }) as {
        sub: string;
        email: string;
        role?: string;
      };

      if (!payload.sub || !payload.email) {
        throw new Error('Token missing required claims (sub, email)');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      // allowed-fabricated-4xx: deliberate cause-inspected classification —
      // jwt error types distinguish expired vs malformed credentials, which
      // mapAndThrow cannot see; auth failures are 401, never a 500.
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException(`Invalid token: ${(error as Error).message}`);
      }
      throw error;
    }
  }
}
