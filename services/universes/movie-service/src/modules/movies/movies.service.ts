import {Inject,  Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { MovieResponse } from './interfaces/movie-response.interface.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import axios from 'axios';
import { randomUUID } from 'crypto';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly walletServiceBaseUrl: string;
  private readonly rentalFee: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.rentalFee = this.configService.get<number>('MOVIE_RENTAL_FEE', 500);
  }

  async listMovies(): Promise<MovieResponse> {
    const cacheK = cacheKey('movie', 'movies:list');
    const cached = await this.cache.get<MovieResponse['data']>(cacheK);
    if (cached) {
      return { success: true, data: cached };
    }

    const movies = await this.prisma.movie.findMany({
      include: {
        viewingWindows: {
          where: { isActive: true },
          orderBy: { startsAt: 'asc' },
        },
        _count: {
          select: { rentals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const result = movies as unknown as MovieResponse['data'];
    await this.cache.set(cacheK, result, 300);

    return {
      success: true,
      data: result,
    };
  }

  async getMovie(movieId: string): Promise<MovieResponse> {
    const cacheK = cacheKey('movie', `movie:${movieId}`);
    const cached = await this.cache.get<MovieResponse['data']>(cacheK);
    if (cached) {
      return { success: true, data: cached };
    }

    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        viewingWindows: {
          where: { isActive: true },
          orderBy: { startsAt: 'asc' },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie not found`);
    }

    const result = movie as unknown as MovieResponse['data'];
    await this.cache.set(cacheK, result, 300);

    return {
      success: true,
      data: result,
    };
  }

  async rentMovie(userId: string, movieId: string): Promise<MovieResponse> {
    const existingRental = await this.prisma.rental.findUnique({
      where: {
        userId_movieId: { userId, movieId },
      },
    });

    if (existingRental) {
      throw new BadRequestException('Movie already rented');
    }

    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const walletResponse = await axios
      .get(`${this.walletServiceBaseUrl}/wallet/user/${userId}`, { timeout: 10000 })
      .then((res) => res.data);
    const wallet = walletResponse?.data;
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }

    if (Number(wallet.balance) < this.rentalFee) {
      throw new BadRequestException('Insufficient wallet balance for rental');
    }

    const idempotencyKey = randomUUID();

    try {
      await axios.post(
        `${this.walletServiceBaseUrl}/wallet/debit`,
        {
          walletId: wallet.id,
          amount: this.rentalFee,
          description: `Movie rental: ${movie.title}`,
          idempotencyKey,
        },
        { timeout: 10000 }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? (error as Error).message : 'Failed to process payment';
      throw new BadRequestException(errorMessage);
    }

    try {
      const rental = await this.prisma.rental.create({
        data: {
          userId,
          movieId,
          status: 'active',
        },
      });

      await this.cache.invalidate('movie:*');

      return {
        success: true,
        data: {
          rentalId: rental.id,
          fee: this.rentalFee,
          message: 'Movie rented successfully',
        },
      };
    } catch (dbError) {
      await axios
        .post(
          `${this.walletServiceBaseUrl}/wallet/credit`,
          {
            walletId: wallet.id,
            amount: this.rentalFee,
            description: `Compensation for failed rental: ${idempotencyKey}`,
            reference: `compensate:${idempotencyKey}`,
          },
          { timeout: 10000 }
        )
        .catch((compensateError: unknown) => {
          this.logger.error('Failed to compensate wallet after rental failure:', compensateError);
        });
      const errorMessage = dbError instanceof Error ? dbError.message : 'Failed to create rental';
      throw new BadRequestException(errorMessage);
    }
  }

  async listPremieres(): Promise<MovieResponse> {
    const premieres = await this.prisma.premiere.findMany({
      include: {
        movie: true,
      },
      orderBy: { startsAt: 'asc' },
      take: 20,
    });

    return {
      success: true,
      data: premieres as unknown as MovieResponse['data'],
    };
  }

  async getWatchlist(userId: string): Promise<MovieResponse> {
    const watchlist = await this.prisma.watchlistItem.findMany({
      where: { userId },
      include: {
        movie: {
          include: {
            viewingWindows: {
              where: { isActive: true },
              orderBy: { startsAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: watchlist as unknown as MovieResponse['data'],
    };
  }

  async addToWatchlist(userId: string, movieId: string): Promise<MovieResponse> {
    const existingItem = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_movieId: { userId, movieId },
      },
    });

    if (existingItem) {
      throw new BadRequestException('Movie already in watchlist');
    }

    const item = await this.prisma.watchlistItem.create({
      data: {
        userId,
        movieId,
      },
    });

    return {
      success: true,
      data: {
        watchlistItemId: item.id,
        message: 'Added to watchlist',
      },
    };
  }

  async removeFromWatchlist(userId: string, movieId: string): Promise<MovieResponse> {
    const item = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_movieId: { userId, movieId },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not in watchlist');
    }

    await this.prisma.watchlistItem.delete({
      where: { id: item.id },
    });

    return {
      success: true,
      data: {
        message: 'Removed from watchlist',
      },
    };
  }

  async getLibrary(userId: string): Promise<MovieResponse> {
    const rentals = await this.prisma.rental.findMany({
      where: { userId, status: 'active' },
      include: {
        movie: {
          include: {
            viewingWindows: {
              where: { isActive: true },
              orderBy: { startsAt: 'asc' },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: rentals as unknown as MovieResponse['data'],
    };
  }

  async createViewingWindow(
    movieId: string,
    data: {
      startsAt: Date;
      endsAt?: Date;
      type: string;
    }
  ): Promise<MovieResponse> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const viewingWindow = await this.prisma.viewingWindow.create({
      data: {
        movieId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        type: data.type,
        isActive: true,
      },
    });

    return {
      success: true,
      data: viewingWindow as unknown as MovieResponse['data'],
    };
  }

  async updateViewingWindow(
    windowId: string,
    data: {
      startsAt?: Date;
      endsAt?: Date;
      type?: string;
      isActive?: boolean;
    }
  ): Promise<MovieResponse> {
    const viewingWindow = await this.prisma.viewingWindow.findUnique({
      where: { id: windowId },
    });

    if (!viewingWindow) {
      throw new NotFoundException('Viewing window not found');
    }

    const updatedWindow = await this.prisma.viewingWindow.update({
      where: { id: windowId },
      data,
    });

    return {
      success: true,
      data: updatedWindow as unknown as MovieResponse['data'],
    };
  }

  async getViewingWindows(movieId: string): Promise<MovieResponse> {
    const viewingWindows = await this.prisma.viewingWindow.findMany({
      where: { movieId },
      orderBy: { startsAt: 'asc' },
    });

    return {
      success: true,
      data: viewingWindows as unknown as MovieResponse['data'],
    };
  }

  async getActiveViewingWindows(): Promise<MovieResponse> {
    const now = new Date();
    const activeWindows = await this.prisma.viewingWindow.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: {
        movie: true,
      },
      orderBy: { startsAt: 'asc' },
    });

    return {
      success: true,
      data: activeWindows as unknown as MovieResponse['data'],
    };
  }

  async checkMovieAvailability(movieId: string): Promise<MovieResponse> {
    const now = new Date();
    const activeWindow = await this.prisma.viewingWindow.findFirst({
      where: {
        movieId,
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
    });

    return {
      success: true,
      data: {
        available: !!activeWindow,
        viewingWindow: activeWindow,
      },
    };
  }
}
