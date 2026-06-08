import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InfluencerService } from './influencer.service';

interface CreateInfluencerData {
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverImage?: string;
  category?: string;
  socialLinks?: string;
}

interface CreateCollaborationData {
  influencerId: string;
  brandName: string;
  campaignName: string;
  description?: string;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
}

interface UpdateInfluencerData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImage?: string;
  category?: string;
  isVerified?: boolean;
  socialLinks?: string;
  status?: string;
}

@ApiTags('Influencer')
@Controller('v1/lifestyle/influencers')
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  @Get()
  @ApiOperation({ summary: 'Get influencers' })
  @ApiResponse({ status: 200, description: 'Influencers list' })
  async getEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string,
    @Query('verified') verified?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.influencerService.getEntries(
      Number(page),
      Number(limit),
      category,
      verified !== undefined ? verified === 'true' : undefined,
      status
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured influencers' })
  @ApiResponse({ status: 200, description: 'Featured list' })
  async getFeatured(@Query('limit') limit = 10): Promise<unknown> {
    return this.influencerService.getFeatured(Number(limit));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get influencer by slug' })
  @ApiResponse({ status: 200, description: 'Influencer details' })
  async getEntry(@Param('slug') slug: string): Promise<unknown> {
    return this.influencerService.getEntryBySlug(slug);
  }

  @Get(':influencerId/collaborations')
  @ApiOperation({ summary: 'Get influencer collaborations' })
  @ApiResponse({ status: 200, description: 'Collaborations list' })
  async getCollaborations(@Param('influencerId') influencerId: string): Promise<unknown> {
    return this.influencerService.getCollaborations(influencerId);
  }

  @Post()
  @ApiOperation({ summary: 'Create influencer entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: CreateInfluencerData): Promise<unknown> {
    return this.influencerService.createEntry(body);
  }

  @Post('collaborations')
  @ApiOperation({ summary: 'Create collaboration' })
  @ApiResponse({ status: 201, description: 'Collaboration created' })
  async createCollaboration(@Body() body: CreateCollaborationData): Promise<unknown> {
    return this.influencerService.createCollaboration(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update influencer entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(
    @Param('id') id: string,
    @Body() body: UpdateInfluencerData
  ): Promise<unknown> {
    return this.influencerService.updateEntry(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete influencer entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.influencerService.deleteEntry(id);
  }
}
