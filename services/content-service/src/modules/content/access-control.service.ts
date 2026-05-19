import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  accessType?: 'free' | 'premium' | 'rental' | 'pass' | 'screening' | 'subscription' | 'unlocked';
  expiresAt?: Date;
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkContentAccess(
    userId: string,
    contentId: string
  ): Promise<AccessCheckResult> {
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
  }

  async checkRentalAccess(userId: string, contentId: string): Promise<AccessCheckResult> {
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
  }

  async checkPassAccess(userId: string, universeId?: string): Promise<AccessCheckResult> {
    return this.checkUserPass(userId, universeId);
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
  }

  async checkLockedExtraAccess(userId: string, extraId: string): Promise<AccessCheckResult> {
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
  }

  async checkMediaPlaybackAccess(
    userId: string,
    contentId: string
  ): Promise<{ canPlay: boolean; signedUrl?: string; expiresIn?: number; reason?: string }> {
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

    return {
      canPlay: true,
      expiresIn: 3600,
    };
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
  }
}