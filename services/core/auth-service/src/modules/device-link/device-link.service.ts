import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, randomInt } from 'crypto';

import { PrismaService } from '../database/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { AuditLogService } from '../audit/audit.service.js';

/**
 * RFC 8628-style device authorization grant for TV (10-foot) devices.
 *
 * Flow:
 *  1. TV calls POST /auth/device/link  → gets a `deviceCode` (secret, held by
 *     the TV only, never displayed) and a `userCode` (shown on screen, e.g.
 *     `7K2M-9QX4`).
 *  2. The user signs in on phone/web, enters the userCode at /link and
 *     confirms (or denies) — requires a valid JWT.
 *  3. The TV polls POST /auth/device/link/poll with its deviceCode. The first
 *     poll after confirmation receives the session tokens (exactly once);
 *     subsequent polls report `expired`.
 *
 * Crypto notes:
 *  - The userCode and deviceCode are stored as HMAC-SHA256 digests, never in
 *    plaintext. HMAC (not bcrypt) is required because lookup is by digest —
 *    salted hashes are non-deterministic and cannot be used as unique keys.
 *  - The userCode alone can never obtain tokens: only the holder of the
 *    256-bit deviceCode can poll, so a code seen on a screenshot is worthless
 *    without the TV that initiated it.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // unambiguous: no 0/O, 1/I/L
const USER_CODE_LENGTH = 8;
const CODE_TTL_SECONDS = 900; // 15 minutes to confirm
const DEFAULT_POLL_INTERVAL_SEC = 5;
const MIN_POLL_INTERVAL_SEC = 2;
const MAX_PENDING_CODES = 1000; // global bound on live pending rows (TTL ages the rest out)

const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DENIED: 'denied',
  EXPIRED: 'expired',
} as const;

export interface InitiateDeviceLinkResult {
  /** Secret credential for polling — the TV stores it, never displays it. */
  deviceCode: string;
  /** On-screen code in display form `XXXX-XXXX`. */
  userCode: string;
  /** ISO timestamp after which the code can no longer be confirmed. */
  expiresAt: string;
  /** How often the TV should poll (seconds). */
  intervalSec: number;
}

/** What the approval screen shows before the user confirms or denies. */
export interface DescribeDeviceLinkResult {
  /** e.g. 'tv' */
  deviceType: string;
  /** Human-readable name the TV reported at initiate time (may be null). */
  deviceName: string | null;
  /** ISO timestamp after which the code can no longer be confirmed. */
  expiresAt: string;
}

export interface DeviceLinkPollResult {
  status: (typeof STATUS)[keyof typeof STATUS];
  intervalSec?: number;
  /** Present exactly once (first poll after confirmation), then never again. */
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
    avatar: string | null;
    role: string;
  };
}

@Injectable()
export class DeviceLinkService {
  private readonly logger = new Logger(DeviceLinkService.name);
  private readonly hashSecret: string;
  private readonly pollIntervalSec: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    // Dedicated secret when provided; otherwise derived from the JWT secret so
    // digests are never computable from the database alone.
    this.hashSecret =
      this.configService.get<string>('DEVICE_LINK_HASH_SECRET') ??
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.pollIntervalSec = Math.max(
      MIN_POLL_INTERVAL_SEC,
      this.configService.get<number>('DEVICE_LINK_POLL_INTERVAL', DEFAULT_POLL_INTERVAL_SEC)
    );
  }

  /** Step 1 — TV: create a pending code pair. */
  async initiate(dto: {
    deviceName?: string;
    deviceType?: string;
  }): Promise<InitiateDeviceLinkResult> {
    const livePending = await this.prisma.deviceLinkCode.count({
      where: { status: STATUS.PENDING, expiresAt: { gt: new Date() } },
    });
    if (livePending >= MAX_PENDING_CODES) {
      throw new BadRequestException('Too many pending device link codes. Try again later.');
    }

    const deviceCode = randomBytes(32).toString('base64url');
    const userCode = this.generateUserCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000);

    await this.prisma.deviceLinkCode.create({
      data: {
        deviceCode: this.hmac(deviceCode),
        code: this.hmac(userCode),
        status: STATUS.PENDING,
        deviceName: dto.deviceName ?? null,
        deviceType: dto.deviceType ?? 'tv',
        intervalSec: this.pollIntervalSec,
        expiresAt,
      },
    });

    return {
      deviceCode,
      userCode: this.formatUserCode(userCode),
      expiresAt: expiresAt.toISOString(),
      intervalSec: this.pollIntervalSec,
    };
  }

  /** Step 3 — TV: poll with the deviceCode until confirmed/denied/expired. */
  async poll(rawDeviceCode: string): Promise<DeviceLinkPollResult> {
    const digest = this.hmac(rawDeviceCode.trim());
    const record = await this.prisma.deviceLinkCode.findUnique({ where: { deviceCode: digest } });

    // Unknown credential → treat as expired so the TV regenerates. No userCode
    // information is involved, so nothing is enumerable through this path.
    if (!record) {
      return { status: STATUS.EXPIRED };
    }

    if (record.status === STATUS.PENDING && record.expiresAt.getTime() < Date.now()) {
      await this.prisma.deviceLinkCode.update({
        where: { id: record.id },
        data: { status: STATUS.EXPIRED },
      });
      return { status: STATUS.EXPIRED, intervalSec: record.intervalSec };
    }

    if (record.status === STATUS.CONFIRMED && !record.tokenIssued) {
      return this.claimTokens(record.id, record.userId, record.intervalSec);
    }

    if (record.status === STATUS.CONFIRMED && record.tokenIssued) {
      return { status: STATUS.EXPIRED, intervalSec: record.intervalSec };
    }

    return {
      status: record.status as DeviceLinkPollResult['status'],
      intervalSec: record.intervalSec,
    };
  }

  /** Step 2 — phone/web: confirm the on-screen code for the signed-in user. */
  async confirm(rawUserCode: string, userId: string): Promise<{ confirmed: boolean }> {
    const normalized = this.normalizeUserCode(rawUserCode);
    if (!normalized) {
      throw new BadRequestException(
        'Invalid code format. Use the 8-character code shown on your TV.'
      );
    }

    const record = await this.prisma.deviceLinkCode.findUnique({
      where: { code: this.hmac(normalized) },
    });
    if (!record || record.status !== STATUS.PENDING) {
      throw new UnauthorizedException('Code not found, already used, or denied');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await this.prisma.deviceLinkCode.update({
        where: { id: record.id },
        data: { status: STATUS.EXPIRED },
      });
      throw new UnauthorizedException('Code has expired. Generate a new code on your TV.');
    }

    await this.prisma.deviceLinkCode.update({
      where: { id: record.id },
      data: {
        status: STATUS.CONFIRMED,
        userId,
      },
    });

    await this.auditLogService.log({
      actor: userId,
      action: 'device_link_confirmed',
      resourceType: 'device_link_code',
      resourceId: record.id,
      result: 'success',
      timestamp: new Date(),
    });

    return { confirmed: true };
  }

  /**
   * Step 2 (preview) — phone/web: describe the pending code so the approval
   * screen can show WHICH device is asking for access. Returns only fields the
   * approving user needs; unknown/used/expired codes get a generic 401, same
   * as confirm/deny (no enumeration beyond the 15-minute brute-force window
   * the rate limit already bounds).
   */
  async describe(rawUserCode: string): Promise<DescribeDeviceLinkResult> {
    const normalized = this.normalizeUserCode(rawUserCode);
    if (!normalized) {
      throw new BadRequestException(
        'Invalid code format. Use the 8-character code shown on your TV.'
      );
    }

    const record = await this.prisma.deviceLinkCode.findUnique({
      where: { code: this.hmac(normalized) },
    });
    if (!record || record.status !== STATUS.PENDING) {
      throw new UnauthorizedException('Code not found, already used, or denied');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await this.prisma.deviceLinkCode.update({
        where: { id: record.id },
        data: { status: STATUS.EXPIRED },
      });
      throw new UnauthorizedException('Code has expired. Generate a new code on your TV.');
    }

    return {
      deviceType: record.deviceType,
      deviceName: record.deviceName,
      expiresAt: record.expiresAt.toISOString(),
    };
  }

  /** Step 2 (alternative) — phone/web: reject the code; the TV stops polling. */
  async deny(rawUserCode: string, userId: string): Promise<{ denied: boolean }> {
    const normalized = this.normalizeUserCode(rawUserCode);
    if (!normalized) {
      throw new BadRequestException(
        'Invalid code format. Use the 8-character code shown on your TV.'
      );
    }

    const record = await this.prisma.deviceLinkCode.findUnique({
      where: { code: this.hmac(normalized) },
    });
    if (!record || record.status !== STATUS.PENDING) {
      throw new UnauthorizedException('Code not found, already used, or denied');
    }

    await this.prisma.deviceLinkCode.update({
      where: { id: record.id },
      data: { status: STATUS.DENIED },
    });

    await this.auditLogService.log({
      actor: userId,
      action: 'device_link_denied',
      resourceType: 'device_link_code',
      resourceId: record.id,
      result: 'success',
      timestamp: new Date(),
    });

    return { denied: true };
  }

  /** Issues tokens via the same generateTokens() path as password/social login. */
  private async claimTokens(
    recordId: string,
    userId: string | null,
    intervalSec: number
  ): Promise<DeviceLinkPollResult> {
    if (!userId) {
      this.logger.warn(`Device link ${recordId} confirmed without a user — treating as pending`);
      return { status: STATUS.PENDING, intervalSec };
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      this.logger.warn(`Device link ${recordId} confirmed for missing user ${userId}`);
      return { status: STATUS.PENDING, intervalSec };
    }

    const tokens = await this.authService.generateTokens(user);

    // Consume the code: tokens are handed out exactly once.
    await this.prisma.deviceLinkCode.update({
      where: { id: recordId },
      data: { tokenIssued: true, status: STATUS.EXPIRED },
    });

    this.logger.log(`Device link completed for user ${userId} (code row ${recordId})`);

    return {
      status: STATUS.CONFIRMED,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  private generateUserCode(): string {
    let code = '';
    for (let i = 0; i < USER_CODE_LENGTH; i++) {
      code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
    }
    return code;
  }

  /** Display form: XXXX-XXXX */
  private formatUserCode(raw: string): string {
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }

  /** Accepts `XXXX-XXXX`, `xxxx xxxx`, `xxxxxxxx` — returns the canonical form. */
  private normalizeUserCode(input: string): string {
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned.length === USER_CODE_LENGTH ? cleaned : '';
  }

  private hmac(value: string): string {
    return createHmac('sha256', this.hashSecret).update(value).digest('hex');
  }
}
