import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { FeatureFlagService, contentFlags } from '@azeebo/feature-flags';
import axios from 'axios';

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  accessType?: 'free' | 'premium' | 'rental' | 'pass' | 'screening' | 'subscription' | 'unlocked';
  expiresAt?: Date;
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {}

  async checkGeoAccess(
    contentId: string,
    userCountry?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!userCountry) return { allowed: true };

    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      select: { allowedCountries: true, blockedCountries: true },
    });

    if (!content) return { allowed: true };

    if (content.blockedCountries.length > 0 && content.blockedCountries.includes(userCountry)) {
      return { allowed: false, reason: 'Content is not available in your region' };
    }

    if (content.allowedCountries.length > 0 && !content.allowedCountries.includes(userCountry)) {
      return { allowed: false, reason: 'Content is not available in your region' };
    }

    return { allowed: true };
  }

  async checkContentAccess(
    userId: string,
    contentId: string,
    userCountry?: string,
    userAge?: number
  ): Promise<AccessCheckResult> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
        include: { universe: true },
      });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      if (content.status !== 'published') {
        return {
          hasAccess: false,
          reason: 'Content is not published',
        };
      }

      // Geo restriction check (service-level enforcement)
      const geoCheck = await this.checkGeoAccess(contentId, userCountry);
      if (!geoCheck.allowed) {
        return {
          hasAccess: false,
          reason: geoCheck.reason,
        };
      }

      // Content rating enforcement
      if (content.minAge && userAge !== undefined && userAge < content.minAge) {
        return {
          hasAccess: false,
          reason: `Content requires age ${content.minAge}+`,
        };
      }

      // content_premium_gate: while the flag is off the entitlement checks
      // below are bypassed and all published content is unlocked (promo/free
      // mode). Flipping it on starts enforcing rental/pass/premium gating.
      if (!(await this.featureFlagService.isEnabled(contentFlags.premiumGate))) {
        return {
          hasAccess: true,
          accessType: content.windowType === 'basic' ? 'free' : 'unlocked',
        };
      }

      const now = new Date();

      if (content.windowType === 'basic') {
        return {
          hasAccess: true,
          accessType: 'free',
        };
      }

      if (content.windowType === 'standard') {
        const userRental = await this.prisma.rental.findUnique({
          where: {
            userId_contentId: { userId, contentId },
          },
        });

        if (userRental && userRental.status === 'active' && userRental.endTime > now) {
          return {
            hasAccess: true,
            accessType: 'rental',
            expiresAt: userRental.endTime,
          };
        }

        const userPass = await this.checkUserPass(userId, content.universeId);
        if (userPass.hasAccess) {
          return userPass;
        }

        return {
          hasAccess: false,
          reason: 'Content requires rental or pass',
          accessType: 'rental',
        };
      }

      if (content.windowType === 'premium' || content.isExclusive || content.isPremiere) {
        const userRental = await this.prisma.rental.findUnique({
          where: {
            userId_contentId: { userId, contentId },
          },
        });

        if (userRental && userRental.status === 'active' && userRental.endTime > now) {
          return {
            hasAccess: true,
            accessType: 'rental',
            expiresAt: userRental.endTime,
          };
        }

        const userPass = await this.checkUserPass(userId, content.universeId);
        if (userPass.hasAccess) {
          return userPass;
        }

        return {
          hasAccess: false,
          reason: 'Content is premium and requires rental, pass, or subscription',
          accessType: 'premium',
        };
      }

      return {
        hasAccess: true,
        accessType: 'free',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to check content access: ${error}`);
      return { hasAccess: false, reason: 'Failed to check content access' };
    }
  }

  async checkRentalAccess(userId: string, contentId: string): Promise<AccessCheckResult> {
    try {
      const rental = await this.prisma.rental.findUnique({
        where: {
          userId_contentId: { userId, contentId },
        },
      });

      if (!rental) {
        return {
          hasAccess: false,
          reason: 'No active rental found',
          accessType: 'rental',
        };
      }

      const now = new Date();

      if (rental.status === 'cancelled') {
        return {
          hasAccess: false,
          reason: 'Rental has been cancelled',
          accessType: 'rental',
        };
      }

      if (rental.endTime <= now) {
        await this.prisma.rental.update({
          where: { id: rental.id },
          data: { status: 'expired' },
        });
        return {
          hasAccess: false,
          reason: 'Rental has expired',
          accessType: 'rental',
        };
      }

      return {
        hasAccess: true,
        accessType: 'rental',
        expiresAt: rental.endTime,
      };
    } catch (error) {
      this.logger.error(`Failed to check rental access: ${error}`);
      return { hasAccess: false, reason: 'Failed to check rental access' };
    }
  }

  async checkPassAccess(userId: string, universeId?: string): Promise<AccessCheckResult> {
    try {
      return this.checkUserPass(userId, universeId);
    } catch (error) {
      this.logger.error(`Failed to check pass access: ${error}`);
      return { hasAccess: false, reason: 'Failed to check pass access' };
    }
  }

  private async checkUserPass(userId: string, universeId?: string): Promise<AccessCheckResult> {
    const now = new Date();

    const passQuery = {
      where: {
        userId,
        status: 'active',
        endTime: { gt: now },
        ...(universeId ? { universeId } : {}),
      },
      orderBy: { endTime: 'desc' as const },
    };

    const activePass = await this.prisma.pass.findFirst(passQuery);

    if (activePass) {
      return {
        hasAccess: true,
        accessType: 'pass',
        expiresAt: activePass.endTime,
      };
    }

    const universalPass = await this.prisma.pass.findFirst({
      where: {
        userId,
        status: 'active',
        endTime: { gt: now },
        universeId: null,
      },
      orderBy: { endTime: 'desc' },
    });

    if (universalPass) {
      return {
        hasAccess: true,
        accessType: 'pass',
        expiresAt: universalPass.endTime,
      };
    }

    return {
      hasAccess: false,
      reason: 'No active pass found',
      accessType: 'pass',
    };
  }

  async checkScreeningAccess(userId: string, screeningId: string): Promise<AccessCheckResult> {
    try {
      const screening = await this.prisma.screening.findUnique({
        where: { id: screeningId },
        include: { content: true },
      });

      if (!screening) {
        throw new NotFoundException('Screening not found');
      }

      const now = new Date();

      if (screening.status === 'cancelled') {
        return {
          hasAccess: false,
          reason: 'Screening has been cancelled',
          accessType: 'screening',
        };
      }

      if (screening.status === 'ended') {
        return {
          hasAccess: false,
          reason: 'Screening has ended',
          accessType: 'screening',
        };
      }

      if (screening.screeningTime > now) {
        return {
          hasAccess: false,
          reason: 'Screening has not started yet',
          accessType: 'screening',
        };
      }

      const hasAccess = await this.checkContentAccess(userId, screening.contentId);

      if (!hasAccess.hasAccess && screening.price) {
        const unlock = await this.prisma.userUnlock.findUnique({
          where: {
            userId_unlockType_resourceId: {
              userId,
              unlockType: 'screening',
              resourceId: screeningId,
            },
          },
        });

        if (unlock && (!unlock.expiresAt || unlock.expiresAt > now)) {
          return {
            hasAccess: true,
            accessType: 'screening',
            expiresAt: unlock.expiresAt || undefined,
          };
        }

        return {
          hasAccess: false,
          reason: 'Screening access requires purchase',
          accessType: 'screening',
        };
      }

      return hasAccess;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to check screening access: ${error}`);
      return { hasAccess: false, reason: 'Failed to check screening access' };
    }
  }

  async checkLockedExtraAccess(userId: string, extraId: string): Promise<AccessCheckResult> {
    try {
      const lockedExtra = await this.prisma.lockedExtra.findUnique({
        where: { id: extraId },
        include: { content: true },
      });

      if (!lockedExtra) {
        throw new NotFoundException('Locked extra not found');
      }

      if (lockedExtra.isUnlocked) {
        return {
          hasAccess: true,
          accessType: 'unlocked',
        };
      }

      const unlock = await this.prisma.userUnlock.findUnique({
        where: {
          userId_unlockType_resourceId: {
            userId,
            unlockType: 'locked_extra',
            resourceId: extraId,
          },
        },
      });

      const now = new Date();

      if (unlock && (!unlock.expiresAt || unlock.expiresAt > now)) {
        return {
          hasAccess: true,
          accessType: 'unlocked',
          expiresAt: unlock.expiresAt || undefined,
        };
      }

      const contentAccess = await this.checkContentAccess(userId, lockedExtra.contentId);

      if (lockedExtra.unlockType === 'purchase' && !contentAccess.hasAccess) {
        return {
          hasAccess: false,
          reason: 'Extra requires purchase',
          accessType: 'premium',
        };
      }

      if (lockedExtra.unlockType === 'rental' && contentAccess.accessType !== 'rental') {
        return {
          hasAccess: false,
          reason: 'Extra requires rental access',
          accessType: 'rental',
        };
      }

      if (lockedExtra.unlockType === 'pass' && contentAccess.accessType !== 'pass') {
        return {
          hasAccess: false,
          reason: 'Extra requires pass access',
          accessType: 'pass',
        };
      }

      return {
        hasAccess: false,
        reason: 'Extra is locked',
        accessType: 'unlocked',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to check locked extra access: ${error}`);
      return { hasAccess: false, reason: 'Failed to check locked extra access' };
    }
  }

  async checkMediaPlaybackAccess(
    userId: string,
    contentId: string
  ): Promise<{ canPlay: boolean; signedUrl?: string; expiresIn?: number; reason?: string }> {
    try {
      const accessCheck = await this.checkContentAccess(userId, contentId);

      if (!accessCheck.hasAccess) {
        return {
          canPlay: false,
          reason: accessCheck.reason,
        };
      }

      const mediaAsset = await this.prisma.mediaAsset.findUnique({
        where: { contentItemId: contentId },
      });

      if (!mediaAsset) {
        return {
          canPlay: false,
          reason: 'Media not available',
        };
      }

      const mediaServiceUrl = this.configService.get<string>('MEDIA_SERVICE_URL');
      if (mediaServiceUrl && mediaAsset.originalUrl) {
        try {
          // Extract storage key from the original URL (S3 path)
          const url = new URL(mediaAsset.originalUrl);
          const storageKey = url.pathname.substring(1); // Remove leading /
          const response = await axios.get(
            `${mediaServiceUrl}/v1/upload/signed-url/${encodeURIComponent(storageKey)}`,
            {
              timeout: 5000,
              headers: {
                'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', ''),
              },
            }
          );
          const signedUrl = response.data?.data?.url || response.data?.url;
          if (signedUrl) {
            return {
              canPlay: true,
              signedUrl,
              expiresIn: 3600,
            };
          }
        } catch (error) {
          this.logger.warn(
            `Failed to get signed URL from media-service: ${(error as Error).message}`
          );
        }
      }

      return {
        canPlay: true,
        expiresIn: 3600,
      };
    } catch (error) {
      this.logger.error(`Failed to check media playback access: ${error}`);
      return { canPlay: false, reason: 'Failed to check media playback access' };
    }
  }

  async getAccessibleContent(
    userId: string,
    options?: {
      universeId?: string;
      windowType?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const { universeId, windowType, page = 1, limit = 20 } = options || {};
      const skip = (page - 1) * limit;
      const now = new Date();

      const freeContent = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          windowType: 'basic',
          ...(universeId ? { universeId } : {}),
        },
        include: { universe: true },
        skip,
        take: limit,
      });

      const accessibleContentIds: string[] = [];

      const userRentals = await this.prisma.rental.findMany({
        where: {
          userId,
          status: 'active',
          endTime: { gt: now },
        },
        select: { contentId: true },
      });
      accessibleContentIds.push(...userRentals.map((r) => r.contentId));

      const userPasses = await this.prisma.pass.findMany({
        where: {
          userId,
          status: 'active',
          endTime: { gt: now },
          ...(universeId ? { universeId } : {}),
        },
      });

      if (userPasses.length > 0) {
        const universeIds = userPasses
          .filter((p) => p.universeId)
          .map((p) => p.universeId as string);

        const passAccessibleContent = await this.prisma.contentItem.findMany({
          where: {
            status: 'published',
            universeId: { in: universeIds },
            windowType: { in: ['standard', 'premium'] },
          },
          select: { id: true },
        });
        accessibleContentIds.push(...passAccessibleContent.map((c) => c.id));
      }

      const premiumContent = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          id: { in: accessibleContentIds },
          ...(universeId ? { universeId } : {}),
          ...(windowType ? { windowType } : {}),
        },
        include: { universe: true },
        skip,
        take: limit,
      });

      return {
        freeContent,
        premiumContent,
        totalFree: freeContent.length,
        totalPremium: premiumContent.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get accessible content: ${error}`);
      return {
        success: false,
        error: {
          code: 'GET_ACCESSIBLE_CONTENT_FAILED',
          message: 'Failed to retrieve accessible content',
        },
      };
    }
  }
}
