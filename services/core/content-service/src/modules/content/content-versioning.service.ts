import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

export interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  createdAt: Date;
  createdBy?: string;
  changeNote?: string;
}

@Injectable()
export class ContentVersioningService {
  private readonly logger = new Logger(ContentVersioningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async createSnapshot(
    contentId: string,
    createdBy?: string,
    changeNote?: string,
  ): Promise<ContentVersion> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }

    const latestVersion = await this.getLatestVersionNumber(contentId);
    const newVersionNumber = latestVersion + 1;

    const snapshot: Record<string, unknown> = {
      title: content.title,
      description: content.description,
      thumbnail: content.thumbnail,
      mediaUrl: content.mediaUrl,
      status: content.status,
      metadata: content.metadata,
      releaseDate: content.releaseDate?.toISOString(),
      windowEndDate: content.windowEndDate?.toISOString(),
      windowType: content.windowType,
      isExclusive: content.isExclusive,
      isPremiere: content.isPremiere,
    };

    const existingMetadata = (content.metadata as Record<string, unknown>) || {};
    const versions = (existingMetadata._versions as ContentVersion[]) || [];

    const version: ContentVersion = {
      id: randomUUID(),
      contentId,
      versionNumber: newVersionNumber,
      snapshot,
      createdAt: new Date(),
      createdBy,
      changeNote,
    };

    versions.push(version);
    const trimmedVersions = versions.slice(-20);

    const newMetadata: Record<string, unknown> = {
      ...existingMetadata,
      _versions: trimmedVersions,
      _latestVersion: newVersionNumber,
    };

    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        metadata: newMetadata as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Created version ${newVersionNumber} for content ${contentId}`);
    return version;
  }

  async getVersionHistory(contentId: string): Promise<ContentVersion[]> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }

    const metadata = (content.metadata as Record<string, unknown>) || {};
    return (metadata._versions as ContentVersion[]) || [];
  }

  async getVersion(contentId: string, versionNumber: number): Promise<ContentVersion | null> {
    const versions = await this.getVersionHistory(contentId);
    return versions.find((v) => v.versionNumber === versionNumber) || null;
  }

  async rollbackToVersion(
    contentId: string,
    versionNumber: number,
    performedBy?: string,
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    const version = await this.getVersion(contentId, versionNumber);
    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found for content ${contentId}`);
    }

    await this.createSnapshot(contentId, performedBy, `Rollback to version ${versionNumber}`);

    const snapshot = version.snapshot;

    const newMetadata: Record<string, unknown> = snapshot.metadata as Record<string, unknown> || {};

    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        title: snapshot.title as string,
        description: snapshot.description as string | null,
        thumbnail: snapshot.thumbnail as string,
        mediaUrl: snapshot.mediaUrl as string | null,
        metadata: newMetadata as unknown as Prisma.InputJsonValue,
        releaseDate: snapshot.releaseDate ? new Date(snapshot.releaseDate as string) : null,
        windowEndDate: snapshot.windowEndDate ? new Date(snapshot.windowEndDate as string) : null,
        windowType: (snapshot.windowType as string) || 'standard',
        isExclusive: (snapshot.isExclusive as boolean) || false,
        isPremiere: (snapshot.isPremiere as boolean) || false,
        updatedAt: new Date(),
      },
    });

    await this.cache.delete(cacheKey('content', contentId));
    this.logger.log(`Rolled back content ${contentId} to version ${versionNumber}`);
    return { success: true, data: snapshot };
  }

  async compareVersions(
    contentId: string,
    versionA: number,
    versionB: number,
  ): Promise<{
    versionA: ContentVersion;
    versionB: ContentVersion;
    differences: Array<{ field: string; before: unknown; after: unknown }>;
  }> {
    const versions = await this.getVersionHistory(contentId);
    const va = versions.find((v) => v.versionNumber === versionA);
    const vb = versions.find((v) => v.versionNumber === versionB);

    if (!va || !vb) {
      throw new NotFoundException('One or both versions not found');
    }

    const differences: Array<{ field: string; before: unknown; after: unknown }> = [];
    const allKeys = new Set([...Object.keys(va.snapshot), ...Object.keys(vb.snapshot)]);

    for (const key of allKeys) {
      if (key.startsWith('_')) continue;
      const before = va.snapshot[key];
      const after = vb.snapshot[key];
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        differences.push({ field: key, before, after });
      }
    }

    return { versionA: va, versionB: vb, differences };
  }

  private async getLatestVersionNumber(contentId: string): Promise<number> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      select: { metadata: true },
    });

    if (!content) return 0;
    const metadata = (content.metadata as Record<string, unknown>) || {};
    return (metadata._latestVersion as number) || 0;
  }
}
