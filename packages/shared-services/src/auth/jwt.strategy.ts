import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { isPlaceholderSecret } from '@azeebo/shared-types';

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
  id: string;
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is required');
    }

    if (isPlaceholderSecret(secret)) {
      throw new Error(
        'JWT_ACCESS_SECRET contains a placeholder value and will NOT work. ' +
        'Generate a real secret with: openssl rand -base64 48'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      audience: configService.get<string>('JWT_AUDIENCE'),
      issuer: configService.get<string>('JWT_ISSUER'),
    });
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
