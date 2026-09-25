import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GuidesAdminService } from './guides-admin.service';
import { PrismaService } from '../database/prisma.service';

describe('GuidesAdminService', () => {
  let service: GuidesAdminService;
  let prismaService: jest.Mocked<PrismaService>;

  const ADMIN_ID = 'admin-1';

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
    stops: [],
  };

  const createDto = {
    title: 'Ikorodu Food Run',
    description: 'Street food loop',
    city: 'Lagos',
    duration: '1 day',
    stops: [
      { name: 'Ewa Agoyin Stand', description: 'Beans and bread', duration: '45 mins', order: 1 },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuidesAdminService,
        {
          provide: PrismaService,
          useValue: {
            itinerary: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            itineraryStop: {
              createMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            neighborhood: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            neighborhoodPlace: {
              createMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            partner: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            partnerOffer: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GuidesAdminService>(GuidesAdminService);
    prismaService = module.get(PrismaService);

    // Transaction mock: run the callback against the same (mocked) delegates.
    (prismaService.$transaction as jest.Mock).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(prismaService)
    );
  });

  // ---------------------------------------------------------------- listings

  describe('listItineraries', () => {
    it('lists all statuses when no filter is given (admin sees drafts)', async () => {
      (prismaService.itinerary.findMany as jest.Mock).mockResolvedValue([]);
      await service.listItineraries();
      expect(prismaService.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('filters by status', async () => {
      (prismaService.itinerary.findMany as jest.Mock).mockResolvedValue([]);
      await service.listItineraries('draft');
      expect(prismaService.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'draft' } })
      );
    });
  });

  // ------------------------------------------------------------- itineraries

  describe('createItinerary', () => {
    it('derives the slug from the title, defaults to draft, and stamps the admin', async () => {
      (prismaService.itinerary.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.itinerary.create as jest.Mock).mockResolvedValue(mockItinerary);

      await service.createItinerary(createDto, ADMIN_ID);

      expect(prismaService.itinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Ikorodu Food Run',
            slug: 'ikorodu-food-run',
            status: 'draft',
            createdById: ADMIN_ID,
            stops: {
              create: [
                {
                  name: 'Ewa Agoyin Stand',
                  description: 'Beans and bread',
                  duration: '45 mins',
                  order: 1,
                },
              ],
            },
          }),
        })
      );
    });

    it('uniquifies the slug with a numeric suffix on collision', async () => {
      const taken = { id: 'other' };
      (prismaService.itinerary.findUnique as jest.Mock)
        .mockResolvedValueOnce(taken) // slug check: ikorodu-food-run (taken)
        .mockResolvedValueOnce(null) // slug check: ikorodu-food-run-2 (free)
        .mockResolvedValue(null); // any later lookups
      (prismaService.itinerary.create as jest.Mock).mockResolvedValue(mockItinerary);

      await service.createItinerary(createDto, ADMIN_ID);

      expect(prismaService.itinerary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'ikorodu-food-run-2' }),
        })
      );
    });
  });

  describe('updateItinerary', () => {
    it('replaces the stop list inside a transaction', async () => {
      (prismaService.itinerary.findUnique as jest.Mock).mockResolvedValue(mockItinerary);
      (prismaService.itinerary.update as jest.Mock).mockResolvedValue(mockItinerary);
      (prismaService.itineraryStop.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.itineraryStop.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.updateItinerary('itin-1', {
        title: 'Renamed',
        stops: [{ name: 'New stop', description: 'd', duration: '1 hr', order: 1 }],
      });

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.itineraryStop.deleteMany).toHaveBeenCalledWith({
        where: { itineraryId: 'itin-1' },
      });
      expect(prismaService.itineraryStop.createMany).toHaveBeenCalledWith({
        data: [
          { itineraryId: 'itin-1', name: 'New stop', description: 'd', duration: '1 hr', order: 1 },
        ],
      });
    });

    it('404s when the itinerary does not exist', async () => {
      (prismaService.itinerary.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.updateItinerary('missing', { title: 'x' })).rejects.toThrow(
        NotFoundException
      );
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('deleteItinerary', () => {
    it('deletes after existence check', async () => {
      (prismaService.itinerary.findUnique as jest.Mock).mockResolvedValue(mockItinerary);
      (prismaService.itinerary.delete as jest.Mock).mockResolvedValue(mockItinerary);
      await expect(service.deleteItinerary('itin-1')).resolves.toEqual({ deleted: true });
      expect(prismaService.itinerary.delete).toHaveBeenCalledWith({ where: { id: 'itin-1' } });
    });

    it('404s on unknown id', async () => {
      (prismaService.itinerary.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.deleteItinerary('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ------------------------------------------------------------------ offers

  describe('createOffer', () => {
    it('converts validUntil to a Date and defaults status to active', async () => {
      (prismaService.partner.findUnique as jest.Mock).mockResolvedValue({ id: 'partner-1' });
      (prismaService.partnerOffer.create as jest.Mock).mockResolvedValue({ id: 'offer-1' });

      await service.createOffer('partner-1', {
        title: 'Half-price ferry',
        description: 'Saturday special',
        discount: '50% OFF',
        category: 'Transport',
        terms: ['Saturdays only'],
        validUntil: '2026-12-31T00:00:00.000Z',
      });

      expect(prismaService.partnerOffer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partnerId: 'partner-1',
            validUntil: new Date('2026-12-31T00:00:00.000Z'),
            status: 'active',
          }),
        })
      );
    });

    it('404s when the parent partner does not exist', async () => {
      (prismaService.partner.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.createOffer('ghost', {
          title: 't',
          description: 'd',
          discount: '10%',
          category: 'c',
          terms: [],
          validUntil: '2026-12-31T00:00:00.000Z',
        })
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.partnerOffer.create).not.toHaveBeenCalled();
    });
  });

  describe('updateOffer', () => {
    it('maps validUntil strings to Dates and passes through scalars', async () => {
      (prismaService.partnerOffer.findUnique as jest.Mock).mockResolvedValue({ id: 'offer-1' });
      (prismaService.partnerOffer.update as jest.Mock).mockResolvedValue({ id: 'offer-1' });

      await service.updateOffer('offer-1', {
        discount: '60% OFF',
        status: 'expired',
        validUntil: '2027-01-15T00:00:00.000Z',
      });

      expect(prismaService.partnerOffer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'offer-1' },
          data: expect.objectContaining({
            discount: '60% OFF',
            status: 'expired',
            validUntil: new Date('2027-01-15T00:00:00.000Z'),
          }),
        })
      );
    });
  });
});
