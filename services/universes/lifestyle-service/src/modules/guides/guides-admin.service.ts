import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateItineraryDto,
  UpdateItineraryDto,
  CreateNeighborhoodDto,
  UpdateNeighborhoodDto,
  CreatePartnerDto,
  UpdatePartnerDto,
  CreatePartnerOfferDto,
  UpdatePartnerOfferDto,
} from './dto/guides-admin.dto';

/**
 * Admin CRUD for the lifestyle guides catalogs (itineraries, neighborhoods,
 * partners, offers). Unlike the public GuidesService — which only ever exposes
 * published/active rows — this service shows every status so editors can work
 * on drafts and archive outdated entries.
 *
 * Slugs are derived from the name and uniquified with numeric suffixes; child
 * collections (stops, places) are replaced wholesale inside a transaction when
 * an update includes them.
 */

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'guide';

@Injectable()
export class GuidesAdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- itineraries

  async listItineraries(status?: string) {
    const where = status && status !== 'all' ? { status } : {};
    return this.prisma.itinerary.findMany({
      where,
      include: { stops: { orderBy: { order: 'asc' as const } } },
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async getItinerary(id: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
      include: { stops: { orderBy: { order: 'asc' as const } } },
    });
    if (!itinerary) throw new NotFoundException('Itinerary not found');
    return itinerary;
  }

  async createItinerary(dto: CreateItineraryDto, adminUserId: string) {
    const slug = await this.uniqueItinerarySlug(slugify(dto.title));
    return this.prisma.itinerary.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        city: dto.city,
        duration: dto.duration,
        rating: dto.rating ?? 0,
        status: dto.status ?? 'draft',
        createdById: adminUserId,
        stops: {
          create: dto.stops.map((s) => ({
            name: s.name,
            description: s.description,
            duration: s.duration,
            order: s.order,
          })),
        },
      },
      include: { stops: { orderBy: { order: 'asc' as const } } },
    });
  }

  async updateItinerary(id: string, dto: UpdateItineraryDto) {
    await this.getItinerary(id);
    const { stops, ...scalar } = dto;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.itinerary.update({ where: { id }, data: scalar });
      if (stops) {
        // Replace the whole stop list — ordering is part of the data.
        await tx.itineraryStop.deleteMany({ where: { itineraryId: id } });
        await tx.itineraryStop.createMany({
          data: stops.map((s) => ({
            itineraryId: id,
            name: s.name,
            description: s.description,
            duration: s.duration,
            order: s.order,
          })),
        });
      }
      return tx.itinerary.findUnique({
        where: { id: updated.id },
        include: { stops: { orderBy: { order: 'asc' as const } } },
      });
    });
  }

  async deleteItinerary(id: string) {
    await this.getItinerary(id);
    await this.prisma.itinerary.delete({ where: { id } });
    return { deleted: true };
  }

  private async uniqueItinerarySlug(candidate: string): Promise<string> {
    if (!(await this.prisma.itinerary.findUnique({ where: { slug: candidate } }))) {
      return candidate;
    }
    for (let n = 2; ; n++) {
      const slug = `${candidate}-${n}`;
      if (!(await this.prisma.itinerary.findUnique({ where: { slug } }))) return slug;
    }
  }

  // -------------------------------------------------------------- neighborhoods

  async listNeighborhoods(status?: string) {
    const where = status && status !== 'all' ? { status } : {};
    return this.prisma.neighborhood.findMany({
      where,
      include: { places: { orderBy: { rating: 'desc' as const } } },
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async getNeighborhood(id: string) {
    const neighborhood = await this.prisma.neighborhood.findUnique({
      where: { id },
      include: { places: { orderBy: { rating: 'desc' as const } } },
    });
    if (!neighborhood) throw new NotFoundException('Neighborhood not found');
    return neighborhood;
  }

  async createNeighborhood(dto: CreateNeighborhoodDto, adminUserId: string) {
    const slug = await this.uniqueNeighborhoodSlug(slugify(dto.name));
    return this.prisma.neighborhood.create({
      data: {
        name: dto.name,
        slug,
        city: dto.city,
        description: dto.description,
        image: dto.image,
        status: dto.status ?? 'draft',
        createdById: adminUserId,
        places: dto.places ? { create: dto.places } : undefined,
      },
      include: { places: { orderBy: { rating: 'desc' as const } } },
    });
  }

  async updateNeighborhood(id: string, dto: UpdateNeighborhoodDto) {
    await this.getNeighborhood(id);
    const { places, ...scalar } = dto;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.neighborhood.update({ where: { id }, data: scalar });
      if (places) {
        await tx.neighborhoodPlace.deleteMany({ where: { neighborhoodId: id } });
        await tx.neighborhoodPlace.createMany({
          data: places.map((p) => ({ ...p, neighborhoodId: id })),
        });
      }
      return tx.neighborhood.findUnique({
        where: { id: updated.id },
        include: { places: { orderBy: { rating: 'desc' as const } } },
      });
    });
  }

  async deleteNeighborhood(id: string) {
    await this.getNeighborhood(id);
    await this.prisma.neighborhood.delete({ where: { id } });
    return { deleted: true };
  }

  private async uniqueNeighborhoodSlug(candidate: string): Promise<string> {
    if (!(await this.prisma.neighborhood.findUnique({ where: { slug: candidate } }))) {
      return candidate;
    }
    for (let n = 2; ; n++) {
      const slug = `${candidate}-${n}`;
      if (!(await this.prisma.neighborhood.findUnique({ where: { slug } }))) return slug;
    }
  }

  // ------------------------------------------------------------------- partners

  async listPartners(status?: string) {
    const where = status && status !== 'all' ? { status } : {};
    return this.prisma.partner.findMany({
      where,
      include: { offers: { orderBy: { validUntil: 'asc' as const } } },
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async getPartner(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: { offers: { orderBy: { validUntil: 'asc' as const } } },
    });
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async createPartner(dto: CreatePartnerDto, adminUserId: string) {
    const slug = await this.uniquePartnerSlug(slugify(dto.name));
    return this.prisma.partner.create({
      data: {
        name: dto.name,
        slug,
        category: dto.category,
        city: dto.city,
        description: dto.description,
        rating: dto.rating ?? 0,
        address: dto.address,
        phone: dto.phone,
        status: dto.status ?? 'draft',
        createdById: adminUserId,
      },
    });
  }

  async updatePartner(id: string, dto: UpdatePartnerDto) {
    await this.getPartner(id);
    return this.prisma.partner.update({ where: { id }, data: dto });
  }

  async deletePartner(id: string) {
    await this.getPartner(id);
    await this.prisma.partner.delete({ where: { id } }); // cascades to offers
    return { deleted: true };
  }

  private async uniquePartnerSlug(candidate: string): Promise<string> {
    if (!(await this.prisma.partner.findUnique({ where: { slug: candidate } }))) {
      return candidate;
    }
    for (let n = 2; ; n++) {
      const slug = `${candidate}-${n}`;
      if (!(await this.prisma.partner.findUnique({ where: { slug } }))) return slug;
    }
  }

  // --------------------------------------------------------------------- offers

  async listOffers(status?: string) {
    const where = status && status !== 'all' ? { status } : {};
    return this.prisma.partnerOffer.findMany({
      where,
      include: { partner: { select: { id: true, name: true, slug: true, category: true } } },
      orderBy: { validUntil: 'asc' as const },
    });
  }

  async getOffer(id: string) {
    const offer = await this.prisma.partnerOffer.findUnique({
      where: { id },
      include: { partner: { select: { id: true, name: true, slug: true, category: true } } },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async createOffer(partnerId: string, dto: CreatePartnerOfferDto) {
    await this.getPartner(partnerId); // 404 with a clear message if bad FK
    return this.prisma.partnerOffer.create({
      data: {
        partnerId,
        title: dto.title,
        description: dto.description,
        discount: dto.discount,
        category: dto.category,
        terms: dto.terms,
        validUntil: new Date(dto.validUntil),
        status: dto.status ?? 'active',
      },
      include: { partner: { select: { id: true, name: true, slug: true, category: true } } },
    });
  }

  async updateOffer(id: string, dto: UpdatePartnerOfferDto) {
    await this.getOffer(id);
    const { validUntil, ...rest } = dto;
    return this.prisma.partnerOffer.update({
      where: { id },
      data: {
        ...rest,
        ...(validUntil ? { validUntil: new Date(validUntil) } : {}),
      },
      include: { partner: { select: { id: true, name: true, slug: true, category: true } } },
    });
  }

  async deleteOffer(id: string) {
    await this.getOffer(id);
    await this.prisma.partnerOffer.delete({ where: { id } });
    return { deleted: true };
  }
}
