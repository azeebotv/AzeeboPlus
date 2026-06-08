import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MovieResponse } from './interfaces/movie-response.interface';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMovies(): Promise<MovieResponse> {
    const movies = await this.prisma.movie.findMany({
      include: {
        creator: true,
        categories: true,
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

    return {
      success: true,
      data: movies as unknown as MovieResponse['data'],
    };
  }

  async getMovie(movieId: string): Promise<MovieResponse> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        creator: true,
        categories: true,
        rentals: true,
        watchlistItems: true,
        viewingWindows: {
          where: { isActive: true },
          orderBy: { startsAt: 'asc' },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie not found`);
    }

    return {
      success: true,
      data: movie as unknown as MovieResponse['data'],
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

    const rental = await this.prisma.rental.create({
      data: {
        userId,
        movieId,
        status: 'active',
      },
    });

    return {
      success: true,
      data: {
        rentalId: rental.id,
        message: 'Movie rented successfully',
      },
    };
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
