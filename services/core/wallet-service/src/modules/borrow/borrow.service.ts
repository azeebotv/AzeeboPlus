import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../prisma/client/index.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreatePartnerBankDto } from './dto/create-partner-bank.dto.js';
import { UpdatePartnerBankDto } from './dto/update-partner-bank.dto.js';

@Injectable()
export class BorrowService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Active partners in display order — the only public read surface. */
  async listActivePartnerBanks() {
    return this.prisma.partnerBank.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getActivePartnerBank(slug: string) {
    const partner = await this.prisma.partnerBank.findFirst({ where: { slug, isActive: true } });
    if (!partner) {
      throw new NotFoundException('Partner bank not found');
    }
    return partner;
  }

  async listAll(options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));

    const [items, total] = await Promise.all([
      this.prisma.partnerBank.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.partnerBank.count(),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(dto: CreatePartnerBankDto) {
    this.assertCoherentTerms(dto);
    try {
      return await this.prisma.partnerBank.create({ data: dto });
    } catch (error: unknown) {
      this.rethrowSlugConflict(error);
    }
  }

  async update(id: string, dto: UpdatePartnerBankDto) {
    const existing = await this.prisma.partnerBank.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Partner bank not found');
    }
    this.assertCoherentTerms({ ...existing, ...dto });

    try {
      return await this.prisma.partnerBank.update({ where: { id }, data: dto });
    } catch (error: unknown) {
      this.rethrowSlugConflict(error);
    }
  }

  async remove(id: string) {
    // Prisma raises P2025 when the row is gone, which rethrowSlugConflict
    // turns into a 404 — no separate existence check needed.
    return this.prisma.partnerBank
      .delete({ where: { id } })
      .catch((error: unknown) => this.rethrowSlugConflict(error));
  }

  /**
   * Ranges are disclosed as ranges, so an inverted one would publish a
   * misleading offer (and a "min > max" amount is impossible to apply for).
   */
  private assertCoherentTerms(terms: {
    minAmount: number | string | Prisma.Decimal;
    maxAmount: number | string | Prisma.Decimal;
    minTenorMonths: number;
    maxTenorMonths: number;
    interestRateMin: number | string | Prisma.Decimal;
    interestRateMax: number | string | Prisma.Decimal;
  }): void {
    const comparisons: Array<[string, unknown, unknown]> = [
      ['amount', terms.minAmount, terms.maxAmount],
      ['tenor', terms.minTenorMonths, terms.maxTenorMonths],
      ['interest rate', terms.interestRateMin, terms.interestRateMax],
    ];
    for (const [label, min, max] of comparisons) {
      if (Number(min) > Number(max)) {
        throw new BadRequestException(`${label} minimum cannot exceed the ${label} maximum`);
      }
    }
  }

  private rethrowSlugConflict(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A partner bank with this slug already exists');
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Partner bank not found');
    }
    throw error;
  }
}
