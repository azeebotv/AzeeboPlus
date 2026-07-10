import {
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
import { AuthGuard } from '@nestjs/passport';
import { CelebrityService } from './celebrity.service';
import { UpdateCelebrityDto } from './dto/update-celebrity.dto';

interface CreateCelebrityData {
  name: string;
  bio?: string;
  coverImage?: string;
  profession?: string;
  nationality?: string;
  birthDate?: string;
  socialLinks?: string;
  isFeatured?: boolean;
  createdById: string;
}

interface CreateNewsData {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  celebrityId: string;
}

@ApiTags('Celebrity')
@Controller('v1/lifestyle/celebrities')
export class CelebrityController {
  constructor(private readonly celebrityService: CelebrityService) {}

  @Get()
  @ApiOperation({ summary: 'Get celebrities' })
  @ApiResponse({ status: 200, description: 'Celebrities list' })
  async getEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('profession') profession?: string,
    @Query('featured') featured?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    const featuredBool = featured !== undefined ? featured === 'true' : undefined;
    return this.celebrityService.getEntries(
      Number(page),
      Number(limit),
      profession,
      featuredBool,
      status
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured celebrities' })
  @ApiResponse({ status: 200, description: 'Featured list' })
  async getFeatured(@Query('limit') limit = 10): Promise<unknown> {
    return this.celebrityService.getFeatured(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get celebrity by slug' })
  @ApiResponse({ status: 200, description: 'Celebrity details' })
  async getEntry(@Param('slug') slug: string): Promise<unknown> {
    return this.celebrityService.getEntryBySlug(slug);
  }

  @Get(':celebrityId/news')
  @ApiOperation({ summary: 'Get celebrity news' })
  @ApiResponse({ status: 200, description: 'News list' })
  async getNews(
    @Param('celebrityId') celebrityId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.celebrityService.getNews(celebrityId, Number(page), Number(limit));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create celebrity entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: CreateCelebrityData): Promise<unknown> {
    return this.celebrityService.createEntry(body);
  }

  @Post('news')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create celebrity news' })
  @ApiResponse({ status: 201, description: 'News created' })
  async createNews(@Body() body: CreateNewsData): Promise<unknown> {
    return this.celebrityService.createNews(body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update celebrity entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(@Param('id') id: string, @Body() body: UpdateCelebrityDto): Promise<unknown> {
    return this.celebrityService.updateEntry(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete celebrity entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.celebrityService.deleteEntry(id);
  }
}
