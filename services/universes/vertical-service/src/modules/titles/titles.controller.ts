import {
  Inject,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminGuard } from '@azeebo/security';
import { TitlesService } from './titles.service';
import { CreateTitleData, CreateChapterData } from './titles.service';
import { UpdateTitleDto } from './dto/update-title.dto';

@ApiTags('Titles')
@Controller('vertical/titles')
export class TitlesController {
  constructor(@Inject(TitlesService) private readonly titlesService: TitlesService) {}

  @Get()
  @ApiOperation({ summary: 'Get titles' })
  @ApiResponse({ status: 200, description: 'Titles list' })
  async getTitles(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('universe') universeSlug?: string,
    @Query('type') type?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.titlesService.getTitles(Number(page), Number(limit), universeSlug, type, status);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured titles' })
  @ApiResponse({ status: 200, description: 'Featured titles' })
  async getFeatured(@Query('limit') limit = 10): Promise<unknown> {
    return this.titlesService.getFeaturedTitles(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get title by slug' })
  @ApiResponse({ status: 200, description: 'Title details' })
  async getTitle(@Param('slug') slug: string): Promise<unknown> {
    return this.titlesService.getTitleBySlug(slug);
  }

  @Get(':slug/episodes')
  @ApiOperation({ summary: 'Get title episodes (chapters in play order)' })
  @ApiResponse({ status: 200, description: 'Episode list' })
  @ApiResponse({ status: 404, description: 'Title not found' })
  async getEpisodes(@Param('slug') slug: string): Promise<unknown> {
    return this.titlesService.getTitleEpisodes(slug);
  }

  @Get(':slug/characters')
  @ApiOperation({ summary: 'Get characters of the title universe' })
  @ApiResponse({ status: 200, description: 'Character list' })
  @ApiResponse({ status: 404, description: 'Title not found' })
  async getCharacters(@Param('slug') slug: string): Promise<unknown> {
    return this.titlesService.getTitleCharacters(slug);
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Get related titles from the same universe' })
  @ApiResponse({ status: 200, description: 'Related titles' })
  @ApiResponse({ status: 404, description: 'Title not found' })
  async getRelated(@Param('slug') slug: string): Promise<unknown> {
    return this.titlesService.getRelatedTitles(slug);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create title' })
  @ApiResponse({ status: 201, description: 'Title created' })
  async createTitle(@Body() body: CreateTitleData): Promise<unknown> {
    return this.titlesService.createTitle(body);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update title' })
  @ApiResponse({ status: 200, description: 'Title updated' })
  async updateTitle(@Param('id') id: string, @Body() body: UpdateTitleDto): Promise<unknown> {
    return this.titlesService.updateTitle(id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete title' })
  @ApiResponse({ status: 200, description: 'Title deleted' })
  async deleteTitle(@Param('id') id: string): Promise<unknown> {
    return this.titlesService.deleteTitle(id);
  }

  @Post(':titleId/chapters')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create chapter' })
  @ApiResponse({ status: 201, description: 'Chapter created' })
  async createChapter(
    @Param('titleId') titleId: string,
    @Body() body: CreateChapterData
  ): Promise<unknown> {
    return this.titlesService.createChapter({ ...body, titleId });
  }

  @Get(':titleId/chapters/:number')
  @ApiOperation({ summary: 'Get chapter' })
  @ApiResponse({ status: 200, description: 'Chapter details' })
  async getChapter(
    @Param('titleId') titleId: string,
    @Param('number') number: string
  ): Promise<unknown> {
    return this.titlesService.getChapter(titleId, parseFloat(number));
  }
}
