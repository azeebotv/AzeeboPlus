import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iss: string;
  aud: string | string[];
  jti?: string;
  iat?: number;
  exp?: number;
}

interface ValidatedUser {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      algorithms: ['HS256'],
      audience: configService.get<string>('JWT_AUDIENCE'),
      issuer: configService.get<string>('JWT_ISSUER'),
    } as StrategyOptionsWithoutRequest);
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    const expectedAudience = this.configService.get<string>('JWT_AUDIENCE');
    const tokenAudience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

    if (expectedAudience && !tokenAudience.includes(expectedAudience)) {
      throw new UnauthorizedException('Invalid token audience');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
