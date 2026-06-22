import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalTitles, totalCharacters, totalUniverses, titlesByStatus, charactersByRole] =
      await Promise.all([
        this.prisma.title.count(),
        this.prisma.character.count(),
        this.prisma.universeMap.count(),
        this.prisma.title.groupBy({ by: ['status'], _count: { status: true } }),
        this.prisma.character.groupBy({ by: ['role'], _count: { role: true } }),
      ]);

    return {
      totalTitles,
      totalCharacters,
      totalUniverses,
      titlesByStatus: titlesByStatus.reduce(
        (acc, s) => ({ ...acc, [String(s.status)]: s._count.status }),
        {}
      ),
      charactersByRole: charactersByRole.reduce(
        (acc, r) => ({ ...acc, [String(r.role)]: r._count.role }),
        {}
      ),
    };
  }

  async getTitles(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [titles, total] = await Promise.all([
      this.prisma.title.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.title.count(),
    ]);

    return { titles, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getCharacters(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [characters, total] = await Promise.all([
      this.prisma.character.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.character.count(),
    ]);

    return { characters, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
