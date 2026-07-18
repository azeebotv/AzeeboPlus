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
   * These are auth endpoints where the user doesn't have a token yet.
   */
  private static readonly PUBLIC_PATH_PATTERNS: RegExp[] = [
    // Auth endpoints (pre-login)
    /^\/(api\/)?(v\d+\/)?auth\/(login|signup|register|refresh|forgot-password|reset-password|verify-email|resend-verification|social\/(google|apple)(\/authorize)?|social\/callback|otp\/(send|verify))$/,
    /^\/(api\/)?(v\d+\/)?auth\/health$/,
    // Gateway health
    /^\/(health|ready|live)$/,
    // Swagger UI
    /^\/docs(\/.*)?$/,
    // Public settings/universes (content-service)
    /^\/api\/v\d+\/public\//,
    // Public content browsing (home feed, featured, trending, new-releases, search, categories, tags)
    // Universe and category content (read-only)
    /^\/api\/v\d+\/content\/universe\/[^/]+$/,
    /^\/api\/v\d+\/content\/category\/[^/]+$/,
    /^\/api\/v\d+\/content\/[^/]+$/,  // Content detail
    /^\/api\/v\d+\/content\/(home|watch|featured|trending|new-releases|featured-slides|popular-region|search|categories|tags)$/,
    // Content detail (read-only, @Public on controller)
    /^\/api\/v\d+\/content\/[^/]+$/,
    // Content comments and related
    /^\/api\/v\d+\/content\/[^/]+\/(comments|related)$/,
    // Universe detail
    /^\/api\/v\d+\/universe\/[^/]+$/,
    // Creator discovery and public profiles
    /^\/api\/v\d+\/creators\/(discover|[^/]+|[^/]+\/content)$/,
    // Universe-specific trending and listing (read-only)
    /^\/api\/v\d+\/(comedy|games|reality|movie|sports|lifestyle|vertical)\/(trending|[^/]+)$/,
    /^\/api\/v\d+\/(comedy|games|reality|movie|sports|lifestyle|vertical)$/,
    // Search suggestions and trending searches
    /^\/api\/v\d+\/search\/(trending|suggestions)$/,
    // Engagement public data (leaderboard, rankings, prediction results)
    /^\/api\/v\d+\/engagement\/(leaderboard|rankings|predictions\/[^/]+\/results)$/,
    // Subscription plans (public, for upsell)
    /^\/api\/v\d+\/subscription\/plans(\/[^/]+)?$/,
    // Moderation report types
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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7);

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
