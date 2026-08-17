import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, ServiceAuthGuard } from '@azeebo/security';

import { SearchService } from './search.service.js';
import { SearchResponse } from './interfaces/search-response.interface.js';
import { LogSearchDto } from './dto/log-search.dto.js';

@ApiTags('Search')
@UseGuards(ServiceAuthGuard)
@Controller('search')
export class SearchController {
  constructor(@Inject(SearchService) private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Universal search' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('universe') universe?: string,
    @Query('categories') categories?: string,
    @Query('tags') tags?: string,
    @Query('contentType') contentType?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('creatorsPage') creatorsPage?: number,
    @Query('creatorsLimit') creatorsLimit?: number,
    @Query('universesPage') universesPage?: number,
    @Query('universesLimit') universesLimit?: number
  ): Promise<SearchResponse> {
    const safeLimit = Math.min(Math.max(1, limit ? Number(limit) : 20), 100);
    return this.searchService.search(query, {
      universe,
      categories: categories ? categories.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined,
      contentType: contentType ? contentType.split(',') : undefined,
      dateRange: dateStart || dateEnd ? { start: dateStart, end: dateEnd } : undefined,
      sort,
      page: page ? Number(page) : 1,
      limit: safeLimit,
      creatorsPage: creatorsPage ? Number(creatorsPage) : undefined,
      creatorsLimit: creatorsLimit ? Math.min(Math.max(1, Number(creatorsLimit)), 100) : undefined,
      universesPage: universesPage ? Number(universesPage) : undefined,
      universesLimit: universesLimit
        ? Math.min(Math.max(1, Number(universesLimit)), 100)
        : undefined,
    });
  }

  @Get('faceted')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Search with faceted filtering' })
  @ApiResponse({ status: 200, description: 'Search results with facets' })
  async searchWithFacets(
    @Query('q') query: string,
    @Query('universe') universe?: string,
    @Query('categories') categories?: string,
    @Query('tags') tags?: string,
    @Query('contentType') contentType?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
    @Query('sort') sort?: string
  ): Promise<SearchResponse> {
    return this.searchService.searchWithFacets(query, {
      universe,
      categories: categories ? categories.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined,
      contentType: contentType ? contentType.split(',') : undefined,
      dateRange: dateStart || dateEnd ? { start: dateStart, end: dateEnd } : undefined,
      sort,
    });
  }

  @Get('suggestions')
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions' })
  async getSuggestions(@Query('q') query: string): Promise<SearchResponse> {
    return this.searchService.getSuggestions(query);
  }

  @Get('trending')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get trending searches' })
  @ApiResponse({ status: 200, description: 'Trending searches' })
  async getTrending(): Promise<SearchResponse> {
    return this.searchService.getTrending();
  }

  @Get('facets')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get search facets' })
  @ApiResponse({ status: 200, description: 'Search facets' })
  async getFacets(
    @Query('q') query?: string,
    @Query('universe') universe?: string
  ): Promise<SearchResponse> {
    return this.searchService.getFacets(query, universe);
  }

  @Post('log')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log search query' })
  @ApiResponse({ status: 200, description: 'Search logged' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logSearch(
    @Request() req: { user: { id: string; sub: string } },
    @Body() body: LogSearchDto
  ): Promise<{ success: boolean }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.searchService.logSearch(
      userId,
      body.query,
      body.resultsCount ?? 0,
      body.correction,
      body.accepted
    );
  }
}
