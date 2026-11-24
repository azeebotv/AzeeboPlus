import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * Lifestyle guides — curated consumer catalogs (itineraries, neighborhoods,
 * partners, offers). Read-only surface for the 9TLIFE web pages; only
 * published/active rows are visible.
 */
@Injectable()
export class GuidesService {
  private readonly logger = new Logger(GuidesService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- itineraries

  async getItineraries() {
    try {
      return await this.prisma.itinerary.findMany({
        where: { status: 'published' },
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      this.logger.error(`Failed to list itineraries: ${error}`);
      throw error;
    }
  }

  async getItinerary(id: string) {
    try {
      const itinerary = await this.prisma.itinerary.findFirst({
        where: { id, status: 'published' },
        include: { stops: { orderBy: { order: 'asc' } } },
      });
      if (!itinerary) {
        throw new NotFoundException('Itinerary not found');
      }
      return itinerary;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get itinerary ${id}: ${error}`);
      throw error;
    }
  }

  // --------------------------------------------------------------- neighborhoods

  async getNeighborhoods() {
    try {
      return await this.prisma.neighborhood.findMany({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to list neighborhoods: ${error}`);
      throw error;
    }
  }

  async getNeighborhood(id: string) {
    try {
      const neighborhood = await this.prisma.neighborhood.findFirst({
        where: { id, status: 'published' },
        include: { places: { orderBy: { rating: 'desc' } } },
      });
      if (!neighborhood) {
        throw new NotFoundException('Neighborhood not found');
      }
      return neighborhood;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get neighborhood ${id}: ${error}`);
      throw error;
    }
  }

  // ------------------------------------------------------------------- partners

  async getPartners() {
    try {
      return await this.prisma.partner.findMany({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to list partners: ${error}`);
      throw error;
    }
  }

  async getPartner(id: string) {
    try {
      const partner = await this.prisma.partner.findFirst({
        where: { id, status: 'published' },
        include: {
          offers: {
            where: { status: 'active', validUntil: { gt: new Date() } },
            orderBy: { validUntil: 'asc' },
          },
        },
      });
      if (!partner) {
        throw new NotFoundException('Partner not found');
      }
      return partner;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get partner ${id}: ${error}`);
      throw error;
    }
  }

  // --------------------------------------------------------------------- offers

  async getOffers() {
    try {
      return await this.prisma.partnerOffer.findMany({
        where: { status: 'active', validUntil: { gt: new Date() } },
        orderBy: { validUntil: 'asc' },
        include: { partner: { select: { id: true, name: true } } },
      });
    } catch (error) {
      this.logger.error(`Failed to list offers: ${error}`);
      throw error;
    }
  }

  async getOffer(id: string) {
    try {
      const offer = await this.prisma.partnerOffer.findFirst({
        where: { id, status: 'active', validUntil: { gt: new Date() } },
        include: { partner: { select: { id: true, name: true } } },
      });
      if (!offer) {
        throw new NotFoundException('Offer not found');
      }
      return offer;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get offer ${id}: ${error}`);
      throw error;
    }
  }
}
