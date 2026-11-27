import { Inject, Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service.js';

@ApiTags('Sports - Highlights')
@Controller('sports')
export class HighlightsController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get('highlights')
  @UseGuards(RateLimitGuard)
  @RateLimit(120, 60000)
  @ApiOperation({ summary: 'List recent match highlights' })
  @ApiResponse({ status: 200, description: 'Highlights list' })
  async getHighlights() {
    const items = await this.prisma.highlight.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { event: { select: { title: true, status: true } } },
    });
    return {
      success: true,
      data: items.map((h) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        thumbnail: h.thumbnail,
        mediaUrl: h.mediaUrl,
        viewCount: h.viewCount,
        eventTitle: h.event?.title ?? null,
        createdAt: h.createdAt,
      })),
    };
  }

  @Get('highlights/:id')
  @UseGuards(RateLimitGuard)
  @RateLimit(120, 60000)
  @ApiOperation({ summary: 'Get highlight detail' })
  @ApiResponse({ status: 200, description: 'Highlight detail' })
  @ApiResponse({ status: 404, description: 'Highlight not found' })
  async getHighlight(@Param('id') id: string) {
    const h = await this.prisma.highlight.findUnique({
      where: { id },
      include: { event: { select: { title: true, status: true } } },
    });
    if (!h) throw new NotFoundException('Highlight not found');
    return {
      success: true,
      data: {
        id: h.id,
        title: h.title,
        description: h.description,
        thumbnail: h.thumbnail,
        mediaUrl: h.mediaUrl,
        viewCount: h.viewCount,
        eventTitle: h.event?.title ?? null,
        createdAt: h.createdAt,
      },
    };
  }
}
