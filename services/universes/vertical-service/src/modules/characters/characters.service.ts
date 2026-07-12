import {Inject,  Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

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

interface PaginatedResponse<T> {
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
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getCharacters(
    page = 1,
    limit = 20,
    universeSlug?: string
  ): Promise<PaginatedResponse<Character>> {
    try {
      const skip = (page - 1) * limit;
      const where: { universeId?: string } = {};

      if (universeSlug) {
        const universe = await this.prisma.universeMap.findUnique({
          where: { slug: universeSlug },
        });
        if (universe) {
          where.universeId = universe.id;
        }
      }

      const [characters, total] = await Promise.all([
        this.prisma.character.findMany({
          where,
          include: { universe: true, _count: { select: { locations: true } } },
          skip,
          take: limit,
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

      return {
        success: true,
        data: {
          items: formattedCharacters,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get characters: ${error}`);
      return {
        success: false,
        data: { items: [], total: 0, page, limit, totalPages: 0 },
      };
    }
  }

  async getCharacterBySlug(
    slug: string
  ): Promise<SingleResponse<Character & { relationships: Relationship[] }>> {
    try {
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

      return {
        success: true,
        data: {
          ...formattedCharacter,
          relationships: formattedRelationships,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get character by slug: ${error}`);
      throw error;
    }
  }

  async getCharacterRelationships(slug: string): Promise<ListResponse<Relationship>> {
    try {
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

      return {
        success: true,
        data: formattedRelationships,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get character relationships: ${error}`);
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

      return {
        success: true,
        data: formattedCharacter,
      };
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

      return {
        success: true,
        data: formattedCharacter,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update character: ${error}`);
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

      return {
        success: true,
        data: formattedRelationship,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to add relationship: ${error}`);
      throw error;
    }
  }
}
