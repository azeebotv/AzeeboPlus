import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GuidesService } from './guides.service';
import { PrismaService } from '../database/prisma.service';

describe('GuidesService', () => {
  let service: GuidesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockItinerary = {
    id: 'itin-1',
    title: 'Lagos in a Day',
    slug: 'lagos-in-a-day',
    description: 'The best of Lagos',
    city: 'Lagos',
    duration: '1 day',
    rating: 4.5,
    status: 'published',
    createdById: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockStop = {
    id: 'stop-1',
    itineraryId: 'itin-1',
    name: 'Nike Art Gallery',
    description: 'Contemporary Nigerian art',
    duration: '2 hours',
    order: 1,
  };

  const mockNeighborhood = {
    id: 'nbhd-1',
    name: 'Victoria Island',
    slug: 'victoria-island',
    city: 'Lagos',
    description: 'The business heart',
    image: null,
    status: 'published',
    createdById: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockPlace = {
    id: 'place-1',
    neighborhoodId: 'nbhd-1',
    name: 'Landmark Beach',
    category: 'beach',
    rating: 4.2,
    address: 'Water Corporation Drive',
  };

  const mockPartner = {
    id: 'partner-1',
    name: 'Cafe Neon',
    slug: 'cafe-neon',
    category: 'dining',
    city: 'Lagos',
    description: 'Rooftop dining',
    rating: 4.7,
    address: '12 Akin Adesola',
    phone: '+2348012345678',
    status: 'published',
    createdById: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockOffer = {
    id: 'offer-1',
    partnerId: 'partner-1',
    title: '2-for-1 brunch',
    description: 'Weekend brunch deal',
    discount: '50% off',
    category: 'dining',
    terms: ['Weekends only'],
    validUntil: new Date('2099-12-31'),
    status: 'active',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    partner: { id: 'partner-1', name: 'Cafe Neon' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuidesService,
        {
          provide: PrismaService,
          useValue: {
            itinerary: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            neighborhood: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            partner: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            partnerOffer: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GuidesService>(GuidesService);
    prismaService = module.get(PrismaService);
  });

  describe('getItineraries', () => {
    it('returns only published itineraries ordered by rating', async () => {
      (prismaService.itinerary.findMany as jest.Mock).mockResolvedValue([mockItinerary]);

      const result = await service.getItineraries();

      expect(result).toEqual([mockItinerary]);
      expect(prismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { status: 'published' },
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('getItinerary', () => {
    it('returns the itinerary with ordered stops', async () => {
      (prismaService.itinerary.findFirst as jest.Mock).mockResolvedValue({
        ...mockItinerary,
        stops: [mockStop],
      });

      const result = await service.getItinerary('itin-1');

      expect(result.stops).toEqual([mockStop]);
      expect(prismaService.itinerary.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'itin-1', status: 'published' },
        })
      );
    });

    it('throws NotFound for unknown id', async () => {
      (prismaService.itinerary.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getItinerary('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNeighborhood', () => {
    it('returns the neighborhood with places', async () => {
      (prismaService.neighborhood.findFirst as jest.Mock).mockResolvedValue({
        ...mockNeighborhood,
        places: [mockPlace],
      });

      const result = await service.getNeighborhood('nbhd-1');

      expect(result.places).toEqual([mockPlace]);
      expect(prismaService.neighborhood.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'nbhd-1', status: 'published' },
        })
      );
    });

    it('throws NotFound for unknown id', async () => {
      (prismaService.neighborhood.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getNeighborhood('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPartner', () => {
    it('returns the partner with only active unexpired offers', async () => {
      (prismaService.partner.findFirst as jest.Mock).mockResolvedValue({
        ...mockPartner,
        offers: [mockOffer],
      });

      const result = await service.getPartner('partner-1');

      expect(result.offers).toEqual([mockOffer]);
      expect(prismaService.partner.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'partner-1', status: 'published' },
        })
      );
      // Offer filter must exclude expired offers at query time.
      const call = (prismaService.partner.findFirst as jest.Mock).mock.calls[0][0];
      expect(call.include.offers.where).toEqual({
        status: 'active',
        validUntil: { gt: expect.any(Date) },
      });
    });

    it('throws NotFound for unknown id', async () => {
      (prismaService.partner.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getPartner('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOffers', () => {
    it('returns only active unexpired offers with partner names', async () => {
      (prismaService.partnerOffer.findMany as jest.Mock).mockResolvedValue([mockOffer]);

      const result = await service.getOffers();

      expect(result).toEqual([mockOffer]);
      expect(prismaService.partnerOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active', validUntil: { gt: expect.any(Date) } },
        })
      );
    });
  });

  describe('getOffer', () => {
    it('returns the offer with partner name', async () => {
      (prismaService.partnerOffer.findFirst as jest.Mock).mockResolvedValue(mockOffer);

      const result = await service.getOffer('offer-1');

      expect(result.partner.name).toBe('Cafe Neon');
    });

    it('throws NotFound for unknown id', async () => {
      (prismaService.partnerOffer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getOffer('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
