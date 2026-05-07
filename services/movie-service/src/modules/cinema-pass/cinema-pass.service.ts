import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface CinemaPass {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
}

interface PassSubscription {
  id: string;
  userId: string;
  passId: string;
  passName: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

interface CinemaPassResponse {
  success: boolean;
  data?:
    | CinemaPass
    | CinemaPass[]
    | PassSubscription
    | PassSubscription[]
    | { items: CinemaPass[]; total: number }
    | { message: string }
    | { hasAccess: boolean; passType?: string };
  error?: { code: string; message: string };
}

@Injectable()
export class CinemaPassService {
  constructor(private prisma: PrismaService) {}

  async getPasses(): Promise<CinemaPassResponse> {
    const passes = await this.prisma.cinemaPass.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    const formatted: CinemaPass[] = passes.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      type: p.type,
      price: Number(p.price),
      currency: p.currency,
      features: p.features || [],
      isActive: p.isActive,
    }));

    return { success: true, data: formatted };
  }

  async getPassById(id: string): Promise<CinemaPassResponse> {
    const pass = await this.prisma.cinemaPass.findUnique({ where: { id } });

    if (!pass) {
      throw new NotFoundException(`Pass not found: ${id}`);
    }

    return {
      success: true,
      data: {
        id: pass.id,
        name: pass.name,
        description: pass.description || '',
        type: pass.type,
        price: Number(pass.price),
        currency: pass.currency,
        features: pass.features || [],
        isActive: pass.isActive,
      },
    };
  }

  async subscribe(userId: string, passId: string, autoRenew = true): Promise<CinemaPassResponse> {
    const existing = await this.prisma.cinemaPassSubscription.findUnique({
      where: { userId_passId: { userId, passId } },
    });

    if (existing && existing.status === 'active') {
      throw new BadRequestException('Already subscribed to this pass');
    }

    const pass = await this.prisma.cinemaPass.findUnique({ where: { id: passId } });
    if (!pass) {
      throw new NotFoundException(`Pass not found: ${passId}`);
    }

    const now = new Date();
    const endDate = new Date();
    if (pass.type === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (pass.type === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = await this.prisma.cinemaPassSubscription.upsert({
      where: { userId_passId: { userId, passId } },
      create: {
        userId,
        passId,
        status: 'active',
        startDate: now,
        endDate,
        autoRenew,
      },
      update: {
        status: 'active',
        startDate: now,
        endDate,
        autoRenew,
      },
      include: { pass: true },
    });

    return {
      success: true,
      data: {
        id: subscription.id,
        userId: subscription.userId,
        passId: subscription.passId,
        passName: subscription.pass.name,
        status: subscription.status,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        autoRenew: subscription.autoRenew,
      },
    };
  }

  async cancelSubscription(userId: string, passId: string): Promise<CinemaPassResponse> {
    const subscription = await this.prisma.cinemaPassSubscription.findUnique({
      where: { userId_passId: { userId, passId } },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.cinemaPassSubscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', autoRenew: false },
    });

    return { success: true, data: { message: 'Subscription cancelled' } };
  }

  async getUserSubscriptions(userId: string): Promise<CinemaPassResponse> {
    const subscriptions = await this.prisma.cinemaPassSubscription.findMany({
      where: { userId },
      include: { pass: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted: PassSubscription[] = subscriptions
      .filter((s) => s.status === 'active')
      .map((s) => ({
        id: s.id,
        userId: s.userId,
        passId: s.passId,
        passName: s.pass.name,
        status: s.status,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        autoRenew: s.autoRenew,
      }));

    return { success: true, data: formatted };
  }

  async checkAccess(
    userId: string,
    movieId: string
  ): Promise<{ hasAccess: boolean; passType?: string }> {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const now = new Date();
    const activeSubscription = await this.prisma.cinemaPassSubscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gt: now },
      },
      include: { pass: true },
    });

    if (!activeSubscription) {
      return { hasAccess: false };
    }

    const viewingWindow = await this.prisma.viewingWindow.findFirst({
      where: {
        movieId,
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
    });

    if (!viewingWindow) {
      return { hasAccess: false };
    }

    if (viewingWindow.type === 'premium' && activeSubscription.pass.type !== 'premium') {
      return { hasAccess: false };
    }

    return { hasAccess: true, passType: activeSubscription.pass.type };
  }
}
