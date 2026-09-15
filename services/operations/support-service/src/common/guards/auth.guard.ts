import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(ConfigService) private configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const payload = this.jwtService.verify(token, {
        audience: this.configService.get<string>('JWT_AUDIENCE', 'azeebo-api'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'azeebo-auth'),
      });
      request.user = payload;
      return true;
    } catch {
      // allowed-fabricated-4xx: token verification is pure client-input
      // handling — malformed, expired, and wrong-signature tokens all get
      // the same uniform 401 (anti-enumeration), and the cause cannot vary
      // beyond a failed verify, so mapAndThrow (which would map plain JWT
      // errors to a 500) is deliberately not used here.
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
