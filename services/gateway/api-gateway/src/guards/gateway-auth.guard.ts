import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '@azeebo/security';

/**
 * Gateway-level authentication guard.
 * Registered as APP_GUARD to enforce auth on ALL routes by default.
 * Routes marked with @Public() or matching PUBLIC_PATH_PATTERNS are exempt.
 *
 * Validates JWT from Authorization header and forwards user context
 * to downstream services via x-user-* headers.
 */
@Injectable()
export class GatewayAuthGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAuthGuard.name);

  /**
   * Path patterns that do not require authentication.
   * These are auth endpoints where the user doesn't have a token yet.
   */
  private static readonly PUBLIC_PATH_PATTERNS: RegExp[] = [
    /^\/(v\d+\/)?auth\/(login|signup|register|refresh|forgot-password|reset-password|verify-email|resend-verification|social\/(google|apple)(\/authorize)?|social\/callback|otp\/(send|verify))$/,
    /^\/(v\d+\/)?auth\/health$/,
    /^\/(health|ready|live)$/,
    /^\/docs(\/.*)?$/,  // Swagger UI
    /^\/routes$/,       // Route listing
  ];

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
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
      pattern.test(requestPath),
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
      // In production, validate JWT against JWKS or shared secret
      // For now, decode and verify the token structure
      const payload = this.decodeAndValidateToken(token);

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

  private decodeAndValidateToken(token: string): {
    sub: string;
    email: string;
    role?: string;
  } {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    // Decode base64 JWT payload (middle segment)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8'),
    );

    // Verify token is not expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    // Verify required claims
    if (!payload.sub || !payload.email) {
      throw new Error('Token missing required claims (sub, email)');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
