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
    /^\/api\/v\d+\/content\/[^/]+$/,
    // Content comments and related
    /^\/api\/v\d+\/content\/[^/]+\/(comments|related)$/,
    // Universe-specific content by slug
    /^\/api\/v\d+\/content\/universe\/[^/]+$/,
    /^\/api\/v\d+\/content\/category\/[^/]+$/,
    // Universe detail
    /^\/api\/v\d+\/universe\/[^/]+$/,
    // Search suggestions and trending searches
    /^\/api\/v\d+\/search\/(trending|suggestions)$/,
    // Moderation report types (needed for report forms before login)
    /^\/api\/v\d+\/moderation\/report-types$/,
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

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Check if the path matches a known public pattern
    const requestPath = request.path || request.url;
    const isPublicPath = GatewayAuthGuard.PUBLIC_PATH_PATTERNS.some((pattern) =>
      pattern.test(requestPath)
    );

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
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid token: ${(error as Error).message}`);
      }
      throw error;
    }
  }
}
