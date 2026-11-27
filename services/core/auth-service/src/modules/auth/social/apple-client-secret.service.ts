import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/**
 * Mints Apple's OAuth "client secret".
 *
 * Apple does not issue a static client secret the way Google does. The value
 * sent as `client_secret` to `https://appleid.apple.com/auth/token` must be a
 * JWT that this service signs itself with the `.p8` key from the Apple
 * developer console — Apple verifies that signature before it will exchange an
 * authorization code. Posting a static string (as this code used to) fails
 * every time with `invalid_client`, which is why Apple sign-in could never
 * complete even with credentials in place.
 *
 * Shape required by Apple:
 *   header  { alg: "ES256", kid: <APPLE_KEY_ID> }
 *   claims  { iss: <APPLE_TEAM_ID>, iat, exp, aud: "https://appleid.apple.com",
 *             sub: <APPLE_CLIENT_ID — the Services ID> }
 *
 * Signing is cheap but not free, and the token is valid for months, so it is
 * minted once and cached in-process. Everything here is deterministic given the
 * config, which is what makes it unit-testable without Apple.
 */

const APPLE_AUDIENCE = 'https://appleid.apple.com';

/**
 * Apple rejects a client secret whose lifetime exceeds six months. 180 days
 * keeps a comfortable margin under that ceiling.
 */
const APPLE_SECRET_TTL_SECONDS = 180 * 24 * 60 * 60;

/**
 * Re-mint this long before expiry rather than exactly at it, so a request can
 * never be issued with a token that expires while it is in flight.
 */
const REFRESH_MARGIN_MS = 60 * 1000;

interface CachedSecret {
  token: string;
  /** Rotation of this value invalidates the cache (a re-keyed .p8). */
  keyId: string;
  refreshAt: number;
}

interface AppleCredentials {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
}

@Injectable()
export class AppleClientSecretService {
  private readonly logger = new Logger(AppleClientSecretService.name);
  private cached: CachedSecret | null = null;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtService) private readonly jwtService: JwtService
  ) {}

  /**
   * The Services ID this deployment authenticates as. It is both the `sub` of
   * the minted client secret and the `aud` an Apple **ID token** must carry, so
   * verification reads it from here rather than parsing the config twice.
   * Throws 503 when unset, which makes audience checks fail closed.
   */
  getClientId(): string {
    return this.readCredentials().clientId;
  }

  /** Returns a signed client secret, minting or reusing the cached one. */
  getClientSecret(): string {
    const credentials = this.readCredentials();

    if (
      this.cached &&
      this.cached.keyId === credentials.keyId &&
      Date.now() < this.cached.refreshAt
    ) {
      return this.cached.token;
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + APPLE_SECRET_TTL_SECONDS;

    let token: string;
    try {
      token = this.jwtService.sign(
        {
          iss: credentials.teamId,
          iat: issuedAt,
          exp: expiresAt,
          aud: APPLE_AUDIENCE,
          sub: credentials.clientId,
        },
        {
          algorithm: 'ES256',
          keyid: credentials.keyId,
          privateKey: credentials.privateKey,
        }
      );
    } catch (error) {
      // The .p8 is key material. Log the cause only — never the key or token.
      this.logger.error(`Apple client secret signing failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException(
        'Apple sign-in is not configured correctly on this deployment'
      );
    }

    this.cached = {
      token,
      keyId: credentials.keyId,
      refreshAt: expiresAt * 1000 - REFRESH_MARGIN_MS,
    };

    return token;
  }

  private readCredentials(): AppleCredentials {
    // Read individually so the four required keys are visible at a glance and
    // each one can be reported by name when missing.
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID')?.trim() ?? '';
    const teamId = this.configService.get<string>('APPLE_TEAM_ID')?.trim() ?? '';
    const keyId = this.configService.get<string>('APPLE_KEY_ID')?.trim() ?? '';
    const rawPrivateKey = this.configService.get<string>('APPLE_PRIVATE_KEY')?.trim() ?? '';

    const missing: string[] = [];
    if (!clientId) missing.push('APPLE_CLIENT_ID');
    if (!teamId) missing.push('APPLE_TEAM_ID');
    if (!keyId) missing.push('APPLE_KEY_ID');
    if (!rawPrivateKey) missing.push('APPLE_PRIVATE_KEY');

    if (missing.length > 0) {
      this.logger.error(`Apple sign-in misconfigured: missing ${missing.join(', ')}`);
      throw new ServiceUnavailableException('Apple sign-in is not configured on this deployment');
    }

    return {
      clientId,
      teamId,
      keyId,
      privateKey: this.normalizePem(rawPrivateKey),
    };
  }

  /**
   * Secret stores almost always hold the `.p8` on a single line with escaped
   * newlines, and some wrap the value in quotes. PEM parsers reject both, so
   * normalise before signing rather than failing with an opaque error.
   */
  private normalizePem(raw: string): string {
    const unquoted = raw.trim().replace(/^["']|["']$/g, '');
    return unquoted.includes('\\n') ? unquoted.replace(/\\n/g, '\n') : unquoted;
  }
}
