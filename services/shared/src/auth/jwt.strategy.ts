import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iss: string;
  aud: string | string[];
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface ValidatedUser {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class SharedJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      audience: configService.get<string>('JWT_AUDIENCE', 'azeebo-api'),
      issuer: configService.get<string>('JWT_ISSUER', 'azeebo-auth-service'),
    });
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    const expectedAudience = this.configService.get<string>('JWT_AUDIENCE', 'azeebo-api');
    const tokenAudience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

    if (expectedAudience && !tokenAudience.includes(expectedAudience)) {
      throw new UnauthorizedException('Invalid token audience');
    }

    const expectedIssuer = this.configService.get<string>('JWT_ISSUER', 'azeebo-auth-service');
    if (payload.iss !== expectedIssuer) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
