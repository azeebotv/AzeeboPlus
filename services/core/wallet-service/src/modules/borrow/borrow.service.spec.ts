import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../prisma/client/index.js';
import { BorrowService } from './borrow.service.js';
import { PrismaService } from '../database/prisma.service.js';

const partnerRow = {
  id: 'pb-1',
  slug: 'partner-a',
  name: 'Partner A',
  minAmount: '10000.00',
  maxAmount: '500000.00',
  minTenorMonths: 1,
  maxTenorMonths: 6,
  interestRateMin: '12.000',
  interestRateMax: '24.000',
  applyUrl: 'https://apply.example.org/partner-a',
  displayOrder: 1,
  isActive: true,
  isSample: true,
};

function knownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('db error', {
    code,
    clientVersion: '6.19.3',
    meta: { target: ['slug'] },
  });
}

describe('BorrowService', () => {
  let service: BorrowService;
  let prisma: { partnerBank: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      partnerBank: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BorrowService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(BorrowService);
  });

  describe('public listing', () => {
    it('returns only active partners in display order', async () => {
      prisma.partnerBank.findMany.mockResolvedValue([partnerRow]);

      const result = await service.listActivePartnerBanks();

      expect(result).toEqual([partnerRow]);
      expect(prisma.partnerBank.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      });
    });

    it('hides an inactive partner from the slug lookup', async () => {
      prisma.partnerBank.findFirst.mockResolvedValue(null);

      await expect(service.getActivePartnerBank('partner-a')).rejects.toThrow(NotFoundException);
      expect(prisma.partnerBank.findFirst).toHaveBeenCalledWith({
        where: { slug: 'partner-a', isActive: true },
      });
    });

    it('returns the partner when it is active', async () => {
      prisma.partnerBank.findFirst.mockResolvedValue(partnerRow);
      await expect(service.getActivePartnerBank('partner-a')).resolves.toEqual(partnerRow);
    });
  });

  describe('admin listing', () => {
    it('clamps pagination so a bad query cannot ask for the whole table', async () => {
      prisma.partnerBank.findMany.mockResolvedValue([]);
      prisma.partnerBank.count.mockResolvedValue(0);

      await service.listAll({ page: 0, limit: 5000 });

      expect(prisma.partnerBank.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 100 })
      );
    });
  });

  describe('offer coherence', () => {
    const base = {
      slug: 'partner-a',
      name: 'Partner A',
      minAmount: 10000,
      maxAmount: 500000,
      minTenorMonths: 1,
      maxTenorMonths: 6,
      interestRateMin: 12,
      interestRateMax: 24,
      applyUrl: 'https://apply.example.org/partner-a',
    };

    it('rejects an inverted amount range before writing', async () => {
      await expect(
        service.create({ ...base, minAmount: 900000, maxAmount: 1000 })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.partnerBank.create).not.toHaveBeenCalled();
    });

    it('rejects an inverted tenor range', async () => {
      await expect(
        service.create({ ...base, minTenorMonths: 24, maxTenorMonths: 3 })
      ).rejects.toThrow('tenor minimum cannot exceed the tenor maximum');
      expect(prisma.partnerBank.create).not.toHaveBeenCalled();
    });

    it('rejects an inverted rate range', async () => {
      await expect(
        service.create({ ...base, interestRateMin: 30, interestRateMax: 5 })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.partnerBank.create).not.toHaveBeenCalled();
    });

    it('checks the merged row on update, not just the patch', async () => {
      // maxAmount: 500 alone is valid — it only becomes an impossible offer
      // against the stored minAmount of 10 000.
      prisma.partnerBank.findUnique.mockResolvedValue(partnerRow);

      await expect(service.update('pb-1', { maxAmount: 500 })).rejects.toThrow(
        'amount minimum cannot exceed the amount maximum'
      );
      expect(prisma.partnerBank.update).not.toHaveBeenCalled();
    });

    it('accepts a coherent patch', async () => {
      prisma.partnerBank.findUnique.mockResolvedValue(partnerRow);
      prisma.partnerBank.update.mockResolvedValue({ ...partnerRow, isActive: false });

      const result = await service.update('pb-1', { isActive: false });

      expect(result).toEqual(expect.objectContaining({ isActive: false }));
    });
  });

  describe('error mapping', () => {
    it('turns a duplicate slug into 409', async () => {
      prisma.partnerBank.create.mockRejectedValue(knownError('P2002'));

      await expect(
        service.create({
          slug: 'partner-a',
          name: 'Partner A',
          minAmount: 1000,
          maxAmount: 2000,
          minTenorMonths: 1,
          maxTenorMonths: 2,
          interestRateMin: 1,
          interestRateMax: 2,
          applyUrl: 'https://apply.example.org/partner-a',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('turns a missing row into 404 on update', async () => {
      prisma.partnerBank.findUnique.mockResolvedValue(null);

      await expect(service.update('nope', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('turns a missing row into 404 on delete', async () => {
      prisma.partnerBank.delete.mockRejectedValue(knownError('P2025'));

      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });

    it('rethrows unrelated prisma errors untouched', async () => {
      const boom = new Error('connection lost');
      prisma.partnerBank.delete.mockRejectedValue(boom);

      await expect(service.remove('pb-1')).rejects.toBe(boom);
    });

    it('deletes the row when it exists', async () => {
      prisma.partnerBank.delete.mockResolvedValue(partnerRow);
      await expect(service.remove('pb-1')).resolves.toEqual(partnerRow);
      expect(prisma.partnerBank.delete).toHaveBeenCalledWith({ where: { id: 'pb-1' } });
    });
  });
});
