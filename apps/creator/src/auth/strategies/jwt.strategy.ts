import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ConfigService) configService: ConfigService) {
    const secret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      audience: 'azeebo-api',
      issuer: 'azeebo-auth',
    });
  }

  async validate(payload: JwtPayload) {
    // `id` mirrors `sub` so controllers reading req.user.id work on both
    // trusted paths (gateway-forwarded headers set id too).
    return { id: payload.sub, sub: payload.sub, email: payload.email, role: payload.role };
  }
}
