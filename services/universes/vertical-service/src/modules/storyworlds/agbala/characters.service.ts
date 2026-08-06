import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from './cache.service';
import { buildOffsetPagination } from './pagination.helper';

export interface Character {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string;
  role: string;
  status: string;
  universeId: string;
  universeName: string;
  locationCount: number;
  createdAt: string;
}

export interface Relationship {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  type: string;
  description: string;
  isOfficial: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

@Injectable()
export class AgbalaCharactersService {
  private readonly logger = new Logger(AgbalaCharactersService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CacheService) private cache: CacheService
  ) {}

  async getCharacters(
    page = 1,
    limit = 20,
    universeSlug?: string
  ): Promise<PaginatedResponse<Character>> {
    try {
      const cacheKey = `characters:list:${universeSlug || 'all'}:${page}:${limit}`;
      const cached = await this.cache.get<PaginatedResponse<Character>>(cacheKey);
      if (cached) return cached;

      const where: { universeId?: string } = {};

      if (universeSlug) {
        const universe = await this.prisma.universeMap.findUnique({
          where: { slug: universeSlug },
        });
        if (universe) {
          where.universeId = universe.id;
        }
      }

      const pagination = buildOffsetPagination(page, limit);

      const [characters, total] = await Promise.all([
        this.prisma.character.findMany({
          where,
          include: { universe: true, _count: { select: { locations: true } } },
          skip: pagination.skip,
          take: pagination.take,
        }),
        this.prisma.character.count({ where }),
      ]);

      const formattedCharacters: Character[] = characters.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        avatarUrl: c.avatarUrl || '',
        role: c.role || '',
        status: c.status,
        universeId: c.universeId,
        universeName: c.universe.name,
        locationCount: c._count.locations,
        createdAt: c.createdAt.toISOString(),
      }));

      const response: PaginatedResponse<Character> = {
        success: true,
        data: {
          items: formattedCharacters,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch characters: ${error}`);
      throw error;
    }
  }

  async getCharacterBySlug(
    slug: string
  ): Promise<SingleResponse<Character & { relationships: Relationship[] }>> {
    try {
      const cacheKey = `characters:detail:${slug}`;
      const cached =
        await this.cache.get<SingleResponse<Character & { relationships: Relationship[] }>>(
          cacheKey
        );
      if (cached) return cached;

      const character = await this.prisma.character.findUnique({
        where: { slug },
        include: { universe: true, _count: { select: { locations: true } } },
      });

      if (!character) {
        throw new NotFoundException(`Character not found: ${slug}`);
      }

      const relationships = await this.prisma.characterRelationship.findMany({
        where: { OR: [{ fromId: character.id }, { toId: character.id }] },
        include: { from: true, to: true },
      });

      const formattedRelationships: Relationship[] = relationships.map((r) => ({
        id: r.id,
        fromId: r.fromId,
        fromName: r.from.name,
        toId: r.toId,
        toName: r.to.name,
        type: r.type,
        description: r.description || '',
        isOfficial: r.isOfficial,
      }));

      const formattedCharacter: Character = {
        id: character.id,
        name: character.name,
        slug: character.slug,
        description: character.description || '',
        avatarUrl: character.avatarUrl || '',
        role: character.role || '',
        status: character.status,
        universeId: character.universeId,
        universeName: character.universe.name,
        locationCount: character._count.locations,
        createdAt: character.createdAt.toISOString(),
      };

      const response = {
        success: true,
        data: {
          ...formattedCharacter,
          relationships: formattedRelationships,
        },
      };

      await this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch character ${slug}: ${error}`);
      throw error;
    }
  }

  async getCharacterRelationships(slug: string): Promise<ListResponse<Relationship>> {
    try {
      const cacheKey = `characters:relationships:${slug}`;
      const cached = await this.cache.get<ListResponse<Relationship>>(cacheKey);
      if (cached) return cached;

      const character = await this.prisma.character.findUnique({
        where: { slug },
      });

      if (!character) {
        throw new NotFoundException(`Character not found: ${slug}`);
      }

      const relationships = await this.prisma.characterRelationship.findMany({
        where: { OR: [{ fromId: character.id }, { toId: character.id }] },
        include: { from: true, to: true },
      });

      const formattedRelationships: Relationship[] = relationships.map((r) => ({
        id: r.id,
        fromId: r.fromId,
        fromName: r.from.name,
        toId: r.toId,
        toName: r.to.name,
        type: r.type,
        description: r.description || '',
        isOfficial: r.isOfficial,
      }));

      const response: ListResponse<Relationship> = {
        success: true,
        data: formattedRelationships,
      };

      await this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch relationships for character ${slug}: ${error}`);
      throw error;
    }
  }

  async createCharacter(data: {
    name: string;
    description?: string;
    universeId: string;
    role?: string;
    avatarUrl?: string;
  }): Promise<SingleResponse<Character>> {
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const character = await this.prisma.character.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          avatarUrl: data.avatarUrl,
          role: data.role,
          universeId: data.universeId,
        },
        include: { universe: true, _count: { select: { locations: true } } },
      });

      const formattedCharacter: Character = {
        id: character.id,
        name: character.name,
        slug: character.slug,
        description: character.description || '',
        avatarUrl: character.avatarUrl || '',
        role: character.role || '',
        status: character.status,
        universeId: character.universeId,
        universeName: character.universe.name,
        locationCount: character._count.locations,
        createdAt: character.createdAt.toISOString(),
      };

      await this.cache.invalidate('characters:');
      return { success: true, data: formattedCharacter };
    } catch (error) {
      this.logger.error(`Failed to create character: ${error}`);
      throw error;
    }
  }

  async updateCharacter(id: string, data: Partial<Character>): Promise<SingleResponse<Character>> {
    try {
      const characterIndex = await this.prisma.character.findUnique({ where: { id } });
      if (!characterIndex) {
        throw new NotFoundException(`Character not found: ${id}`);
      }

      const character = await this.prisma.character.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          avatarUrl: data.avatarUrl,
          role: data.role,
          status: data.status,
        },
        include: { universe: true, _count: { select: { locations: true } } },
      });

      const formattedCharacter: Character = {
        id: character.id,
        name: character.name,
        slug: character.slug,
        description: character.description || '',
        avatarUrl: character.avatarUrl || '',
        role: character.role || '',
        status: character.status,
        universeId: character.universeId,
        universeName: character.universe.name,
        locationCount: character._count.locations,
        createdAt: character.createdAt.toISOString(),
      };

      await this.cache.invalidate('characters:');
      return { success: true, data: formattedCharacter };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update character ${id}: ${error}`);
      throw error;
    }
  }

  async addRelationship(
    fromId: string,
    data: { toId: string; type: string; description?: string }
  ): Promise<SingleResponse<Relationship>> {
    try {
      const fromCharacter = await this.prisma.character.findUnique({ where: { id: fromId } });
      const toCharacter = await this.prisma.character.findUnique({ where: { id: data.toId } });
      if (!fromCharacter || !toCharacter) {
        throw new NotFoundException('Character not found');
      }

      const relationship = await this.prisma.characterRelationship.create({
        data: {
          fromId,
          toId: data.toId,
          type: data.type,
          description: data.description,
        },
        include: { from: true, to: true },
      });

      const formattedRelationship: Relationship = {
        id: relationship.id,
        fromId: relationship.fromId,
        fromName: relationship.from.name,
        toId: relationship.toId,
        toName: relationship.to.name,
        type: relationship.type,
        description: relationship.description || '',
        isOfficial: relationship.isOfficial,
      };

      await this.cache.invalidate(`characters:relationships:${fromCharacter.slug}`);
      await this.cache.invalidate(`characters:relationships:${toCharacter.slug}`);
      return { success: true, data: formattedRelationship };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to add relationship: ${error}`);
      throw error;
    }
  }
}
