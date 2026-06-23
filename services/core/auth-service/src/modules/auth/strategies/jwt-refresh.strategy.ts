import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

interface RefreshTokenPayload {
  userId: string;
  refreshToken: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || '',
      passReqToCallback: true,
    } as any);
  }

  async validate(req: Request, payload: JwtPayload): Promise<RefreshTokenPayload> {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader?.replace('Bearer ', '');
    return {
      userId: payload.sub,
      refreshToken: refreshToken || '',
    };
  }
}
