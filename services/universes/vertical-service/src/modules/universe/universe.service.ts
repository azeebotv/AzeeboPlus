import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface LocationData {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  universeId: string;
  universeName: string;
  parentId: string;
  parentName: string;
  childCount: number;
  characterCount: number;
  createdAt: string;
  updatedAt?: string;
  children?: LocationData[];
}

interface UniverseData {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  status: string;
  characterCount: number;
  locationCount: number;
  createdAt: string;
  locations?: LocationData[];
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
export class UniverseService {
  private readonly logger = new Logger(UniverseService.name);

  constructor(private prisma: PrismaService) {}

  async getUniverses(page = 1, limit = 20): Promise<PaginatedResponse<UniverseData>> {
    try {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.prisma.universeMap.findMany({
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                characters: true,
                locations: true,
              },
            },
          },
        }),
        this.prisma.universeMap.count(),
      ]);

      const formattedItems: UniverseData[] = items.map((universe) => ({
        id: universe.id,
        name: universe.name,
        slug: universe.slug,
        description: universe.description || '',
        imageUrl: universe.imageUrl || '',
        status: universe.status,
        characterCount: universe._count.characters,
        locationCount: universe._count.locations,
        createdAt: universe.createdAt.toISOString(),
      }));

      return {
        success: true,
        data: {
          items: formattedItems,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get universes: ${error}`);
      return {
        success: false,
        data: { items: [], total: 0, page, limit, totalPages: 0 },
      };
    }
  }

  async getUniverseMap(slug: string): Promise<SingleResponse<UniverseData>> {
    try {
      const universe = await this.prisma.universeMap.findUnique({
        where: { slug },
        include: {
          locations: true,
        },
      });

      if (!universe) {
        throw new NotFoundException(`Universe not found: ${slug}`);
      }

      const formattedLocations: LocationData[] = universe.locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        slug: loc.slug,
        description: loc.description || '',
        imageUrl: loc.imageUrl || '',
        latitude: loc.latitude || 0,
        longitude: loc.longitude || 0,
        universeId: loc.universeId,
        universeName: universe.name,
        parentId: loc.parentId || '',
        parentName: '',
        childCount: 0,
        characterCount: 0,
        createdAt: loc.createdAt.toISOString(),
      }));

      return {
        success: true,
        data: {
          id: universe.id,
          name: universe.name,
          slug: universe.slug,
          description: universe.description || '',
          imageUrl: universe.imageUrl || '',
          status: universe.status,
          characterCount: 0,
          locationCount: universe.locations.length,
          createdAt: universe.createdAt.toISOString(),
          locations: formattedLocations,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get universe map: ${error}`);
      throw error;
    }
  }

  async getLocations(universeSlug?: string): Promise<ListResponse<LocationData>> {
    try {
      const where: { universeId?: string } = {};

      if (universeSlug) {
        const universe = await this.prisma.universeMap.findUnique({
          where: { slug: universeSlug },
        });
        if (universe) {
          where.universeId = universe.id;
        }
      }

      const locations = await this.prisma.location.findMany({
        where,
        include: { universe: true },
      });

      const formattedLocations: LocationData[] = locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        slug: loc.slug,
        description: loc.description || '',
        imageUrl: loc.imageUrl || '',
        latitude: loc.latitude || 0,
        longitude: loc.longitude || 0,
        universeId: loc.universeId,
        universeName: loc.universe.name,
        parentId: loc.parentId || '',
        parentName: '',
        childCount: 0,
        characterCount: 0,
        createdAt: loc.createdAt.toISOString(),
      }));

      return {
        success: true,
        data: formattedLocations,
      };
    } catch (error) {
      this.logger.error(`Failed to get locations: ${error}`);
      return {
        success: true,
        data: [],
      };
    }
  }

  async getLocationBySlug(slug: string): Promise<SingleResponse<LocationData>> {
    try {
      const location = await this.prisma.location.findUnique({
        where: { slug },
        include: { universe: true, parent: true, children: true },
      });

      if (!location) {
        throw new NotFoundException(`Location not found: ${slug}`);
      }

      const formattedChildren: LocationData[] = location.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description || '',
        imageUrl: child.imageUrl || '',
        latitude: child.latitude || 0,
        longitude: child.longitude || 0,
        universeId: child.universeId,
        universeName: location.universe.name,
        parentId: location.id,
        parentName: location.name,
        childCount: 0,
        characterCount: 0,
        createdAt: child.createdAt.toISOString(),
      }));

      return {
        success: true,
        data: {
          id: location.id,
          name: location.name,
          slug: location.slug,
          description: location.description || '',
          imageUrl: location.imageUrl || '',
          latitude: location.latitude || 0,
          longitude: location.longitude || 0,
          universeId: location.universeId,
          universeName: location.universe.name,
          parentId: location.parentId || '',
          parentName: location.parent?.name || '',
          childCount: location.children.length,
          characterCount: 0,
          createdAt: location.createdAt.toISOString(),
          children: formattedChildren,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get location by slug: ${error}`);
      throw error;
    }
  }

  async createLocation(data: {
    name: string;
    description?: string;
    universeId: string;
    latitude?: number;
    longitude?: number;
    parentId?: string;
  }): Promise<SingleResponse<LocationData>> {
    try {
      const universe = await this.prisma.universeMap.findUnique({
        where: { id: data.universeId },
      });

      if (!universe) {
        throw new NotFoundException(`Universe not found: ${data.universeId}`);
      }

      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newLocation = await this.prisma.location.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: '',
          latitude: data.latitude,
          longitude: data.longitude,
          universeId: data.universeId,
          parentId: data.parentId,
        },
        include: { universe: true },
      });

      return {
        success: true,
        data: {
          id: newLocation.id,
          name: newLocation.name,
          slug: newLocation.slug,
          description: newLocation.description || '',
          imageUrl: newLocation.imageUrl || '',
          latitude: newLocation.latitude || 0,
          longitude: newLocation.longitude || 0,
          universeId: newLocation.universeId,
          universeName: newLocation.universe.name,
          parentId: newLocation.parentId || '',
          parentName: '',
          childCount: 0,
          characterCount: 0,
          createdAt: newLocation.createdAt.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to create location: ${error}`);
      throw error;
    }
  }

  async updateLocation(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      latitude: number;
      longitude: number;
    }>
  ): Promise<SingleResponse<LocationData>> {
    try {
      const locationIndex = await this.prisma.location.findUnique({ where: { id } });

      if (!locationIndex) {
        throw new NotFoundException(`Location not found: ${id}`);
      }

      const updated = await this.prisma.location.update({
        where: { id },
        data,
        include: { universe: true },
      });

      return {
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          description: updated.description || '',
          imageUrl: updated.imageUrl || '',
          latitude: updated.latitude || 0,
          longitude: updated.longitude || 0,
          universeId: updated.universeId,
          universeName: updated.universe.name,
          parentId: updated.parentId || '',
          parentName: '',
          childCount: 0,
          characterCount: 0,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt?.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update location: ${error}`);
      throw error;
    }
  }

  async getCategories(): Promise<
    ListResponse<{ id: string; name: string; slug: string; description: string; icon?: string }>
  > {
    const categories = [
      {
        id: 'sports',
        name: 'Sports',
        slug: 'sports',
        description: 'Sports content and events',
        icon: '⚽',
      },
      {
        id: 'games',
        name: 'Games',
        slug: 'games',
        description: 'Interactive games and tournaments',
        icon: '🎮',
      },
      {
        id: 'comedy',
        name: 'Comedy',
        slug: 'comedy',
        description: 'Comedy shows and specials',
        icon: '😂',
      },
      {
        id: 'movie',
        name: 'Movies',
        slug: 'movie',
        description: 'Movies and filmmaker content',
        icon: '🎬',
      },
      {
        id: 'lifestyle',
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Lifestyle and culture content',
        icon: '🌟',
      },
      {
        id: 'reality',
        name: 'Reality',
        slug: 'reality',
        description: 'Reality shows and voting',
        icon: '📺',
      },
    ];

    return {
      success: true,
      data: categories,
    };
  }
}
