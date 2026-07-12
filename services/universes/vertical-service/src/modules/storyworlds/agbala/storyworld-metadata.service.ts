import {Inject,  Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from './cache.service';

export interface StoryworldMetadataItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  type?: string;
  status?: string;
  data?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class StoryworldMetadataService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {}

  async getRealms(universeId: string, page = 1, limit = 20): Promise<{ data: StoryworldMetadataItem[]; total: number }> {
    const cacheK = `realms:${universeId}:${page}:${limit}`;
    const cached = this.cache.get<{ data: StoryworldMetadataItem[]; total: number }>(cacheK);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.prisma.realm.findMany({
        where: { universeId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.realm.count({ where: { universeId } }),
    ]);

    const result = { data, total };
    this.cache.set(cacheK, result, 300);
    return result;
  }

  async getRealmBySlug(slug: string): Promise<StoryworldMetadataItem> {
    const realm = await this.prisma.realm.findUnique({ where: { slug } });
    if (!realm) throw new NotFoundException(`Realm '${slug}' not found`);
    return realm;
  }

  async getOrisaFiles(universeId: string, page = 1, limit = 20): Promise<{ data: StoryworldMetadataItem[]; total: number }> {
    const cacheK = `orisa:${universeId}:${page}:${limit}`;
    const cached = this.cache.get<{ data: StoryworldMetadataItem[]; total: number }>(cacheK);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.prisma.orisaFile.findMany({
        where: { universeId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.orisaFile.count({ where: { universeId } }),
    ]);

    const result = { data, total };
    this.cache.set(cacheK, result, 300);
    return result;
  }

  async getOrisaFileBySlug(slug: string): Promise<StoryworldMetadataItem> {
    const orisa = await this.prisma.orisaFile.findUnique({ where: { slug } });
    if (!orisa) throw new NotFoundException(`Orisa file '${slug}' not found`);
    return orisa;
  }

  async getArtifacts(universeId: string, page = 1, limit = 20): Promise<{ data: StoryworldMetadataItem[]; total: number }> {
    const cacheK = `artifacts:${universeId}:${page}:${limit}`;
    const cached = await this.cache.get<{ data: StoryworldMetadataItem[]; total: number }>(cacheK);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.prisma.artifact.findMany({
        where: { universeId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.artifact.count({ where: { universeId } }),
    ]);

    const result = { data, total };
    this.cache.set(cacheK, result, 300);
    return result;
  }

  async getArtifactBySlug(slug: string): Promise<StoryworldMetadataItem> {
    const artifact = await this.prisma.artifact.findUnique({ where: { slug } });
    if (!artifact) throw new NotFoundException(`Artifact '${slug}' not found`);
    return artifact;
  }

  async getProphecies(universeId: string, page = 1, limit = 20): Promise<{ data: StoryworldMetadataItem[]; total: number }> {
    const cacheK = `prophecies:${universeId}:${page}:${limit}`;
    const cached = await this.cache.get<{ data: StoryworldMetadataItem[]; total: number }>(cacheK);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.prisma.prophecy.findMany({
        where: { universeId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prophecy.count({ where: { universeId } }),
    ]);

    const result = { data, total };
    this.cache.set(cacheK, result, 300);
    return result;
  }

  async getProphecyBySlug(slug: string): Promise<StoryworldMetadataItem> {
    const prophecy = await this.prisma.prophecy.findUnique({ where: { slug } });
    if (!prophecy) throw new NotFoundException(`Prophecy '${slug}' not found`);
    return prophecy;
  }

  async getWorldMaps(universeId: string, page = 1, limit = 20): Promise<{ data: StoryworldMetadataItem[]; total: number }> {
    const cacheK = `maps:${universeId}:${page}:${limit}`;
    const cached = await this.cache.get<{ data: StoryworldMetadataItem[]; total: number }>(cacheK);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.prisma.worldMap.findMany({
        where: { universeId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.worldMap.count({ where: { universeId } }),
    ]);

    const result = { data, total };
    this.cache.set(cacheK, result, 300);
    return result;
  }

  async getWorldMapBySlug(slug: string): Promise<StoryworldMetadataItem> {
    const map = await this.prisma.worldMap.findUnique({ where: { slug } });
    if (!map) throw new NotFoundException(`World map '${slug}' not found`);
    return map;
  }
}
