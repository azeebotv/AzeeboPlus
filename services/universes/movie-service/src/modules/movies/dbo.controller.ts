import { Inject, Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service.js';

/**
 * Public Digital Box Office (DBO) aggregate for the Cinemaxis DBO page.
 * Reads real revenue signals: rentals (fee-based) and cinema pass
 * subscriptions. There is no transaction ledger in movie-service —
 * charges are delegated to wallet-service — so figures are derived
 * from rental + subscription volume.
 */
@ApiTags('Movies - Digital Box Office')
@Controller('movies/dbo')
export class DboController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get('overview')
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Digital Box Office overview' })
  @ApiResponse({ status: 200, description: 'DBO aggregates' })
  async getOverview() {
    const [rentals, passSubs, topMovies] = await Promise.all([
      this.prisma.rental.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: { movie: { select: { id: true, title: true } } },
      }),
      this.prisma.cinemaPassSubscription.findMany({
        where: { status: 'active' },
        include: { pass: { select: { price: true, currency: true } } },
      }),
      this.prisma.movie.findMany({
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: { id: true, title: true, viewCount: true },
      }),
    ]);

    // Real money signal available locally: active cinema pass subscription
    // value. Rental fees are charged in wallet-service and not mirrored here.
    const passRevenue = passSubs.reduce((s, sub) => s + Number(sub.pass.price), 0);
    const totalTickets = rentals.length + passSubs.length;

    // Average pass price as the average ticket price proxy (rental fee lives
    // in wallet-service records, not here).
    const avgPassPrice =
      passSubs.length > 0
        ? passSubs.reduce((s, sub) => s + Number(sub.pass.price), 0) / passSubs.length
        : 0;

    const films = topMovies.map((m) => ({
      id: m.id,
      title: m.title,
      ticketsSold: rentals.filter((r) => r.movieId === m.id).length,
      revenue: rentals.filter((r) => r.movieId === m.id).length * avgPassPrice,
      views: m.viewCount,
    }));

    return {
      success: true,
      data: {
        totalRevenue: Math.round(passRevenue),
        totalTickets,
        averageTicketPrice: Math.round(avgPassPrice),
        films,
        recentTransactions: [],
      },
    };
  }
}
