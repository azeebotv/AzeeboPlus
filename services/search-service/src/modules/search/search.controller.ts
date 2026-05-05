import { Controller, Get, Post, Body, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { SearchService } from './search.service';
import { SearchResponse } from './interfaces/search-response.interface';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
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
    @Query('sort') sort?: string
  ): Promise<SearchResponse> {
    return this.searchService.search(query, {
      universe,
      categories: categories ? categories.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined,
      contentType: contentType ? contentType.split(',') : undefined,
      dateRange: dateStart || dateEnd ? { start: dateStart, end: dateEnd } : undefined,
      sort,
    });
  }

  @Get('faceted')
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
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions' })
  async getSuggestions(@Query('q') query: string): Promise<SearchResponse> {
    return this.searchService.getSuggestions(query);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending searches' })
  @ApiResponse({ status: 200, description: 'Trending searches' })
  async getTrending(): Promise<SearchResponse> {
    return this.searchService.getTrending();
  }

  @Get('facets')
  @ApiOperation({ summary: 'Get search facets' })
  @ApiResponse({ status: 200, description: 'Search facets' })
  async getFacets(
    @Query('q') query?: string,
    @Query('universe') universe?: string
  ): Promise<SearchResponse> {
    return this.searchService.getFacets(query, universe);
  }

  @Post('log')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log search query' })
  @ApiResponse({ status: 200, description: 'Search logged' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logSearch(@Request() req: { user: { id: string; sub: string } }, @Body() body: { query: string; resultsCount?: number }): Promise<{ success: boolean }> {
    return this.searchService.logSearch(req.user.id, body.query, body.resultsCount ?? 0);
  }
}
