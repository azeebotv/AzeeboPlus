import { Inject, Controller, Get, Post, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AgbalaTitlesService as TitlesService } from './agbala/titles.service';
import { AgbalaCharactersService as CharactersService } from './agbala/characters.service';
import { TheoryService } from './agbala/theory.service';
import { RoomService } from './agbala/room.service';
import { SanitizationService } from './agbala/sanitization.service';
import { StoryworldMetadataService } from './agbala/storyworld-metadata.service';

@ApiTags('Storyworlds')
@Controller('v1/vertical/storyworlds')
export class StoryworldsController {
  private readonly logger = new Logger(StoryworldsController.name);

  constructor(
    @Inject(TitlesService) private readonly titlesService: TitlesService,
    @Inject(CharactersService) private readonly charactersService: CharactersService,
    @Inject(TheoryService) private readonly theoryService: TheoryService,
    @Inject(RoomService) private readonly roomService: RoomService,
    @Inject(SanitizationService) private readonly sanitizationService: SanitizationService,
    @Inject(StoryworldMetadataService) private readonly metadataService: StoryworldMetadataService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all storyworlds' })
  async getStoryworlds() {
    try {
      const storyworlds = await this.titlesService.getStoryworlds();
      return { success: true, data: storyworlds };
    } catch (error) {
      this.logger.error(`getStoryworlds failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get storyworld by slug' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async getStoryworld(@Param('slug') slug: string) {
    return this.titlesService.getTitles(1, 100, slug);
  }

  @Get(':slug/titles')
  @ApiOperation({ summary: 'List titles in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getTitles(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.titlesService.getTitles(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      slug
    );
  }

  @Get(':slug/characters')
  @ApiOperation({ summary: 'List characters in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getCharacters(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.charactersService.getCharacters(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      slug
    );
  }

  @Get(':slug/theories')
  @ApiOperation({ summary: 'List theories in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getTheories(
    @Param('slug') _slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.theoryService.getTheories(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Post(':slug/theories')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit a theory' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async createTheory(
    @Param('slug') _slug: string,
    @Body() body: { title: string; content: string; spoilerLevel?: string },
    @Request() req: { user: { id: string; displayName: string } }
  ) {
    return this.theoryService.createTheory({
      title: body.title,
      content: body.content,
      authorId: req.user.id,
      authorName: req.user.displayName,
      spoilerLevel: body.spoilerLevel || 'none',
    });
  }

  @Get(':slug/realms')
  @ApiOperation({ summary: 'List realms in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getRealms(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const universe = await this.titlesService.getStoryworldBySlug(slug);
    return this.metadataService.getRealms(
      universe.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get(':slug/orisa')
  @ApiOperation({ summary: 'List orisa files in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getOrisa(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const universe = await this.titlesService.getStoryworldBySlug(slug);
    return this.metadataService.getOrisaFiles(
      universe.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get(':slug/artifacts')
  @ApiOperation({ summary: 'List artifacts in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getArtifacts(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const universe = await this.titlesService.getStoryworldBySlug(slug);
    return this.metadataService.getArtifacts(
      universe.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get(':slug/prophecies')
  @ApiOperation({ summary: 'List prophecies in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getProphecies(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const universe = await this.titlesService.getStoryworldBySlug(slug);
    return this.metadataService.getProphecies(
      universe.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get(':slug/maps')
  @ApiOperation({ summary: 'List maps in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getMaps(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const universe = await this.titlesService.getStoryworldBySlug(slug);
    return this.metadataService.getWorldMaps(
      universe.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Post(':slug/unlock')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Validate unlock code' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async validateUnlock(
    @Param('slug') slug: string,
    @Body() body: { code: string },
    @Request() req: { user: { id: string } }
  ) {
    if (!body.code || !this.sanitizationService.validateUnlockCode(body.code)) {
      return { success: false, error: { code: 'INVALID_CODE', message: 'Invalid unlock code format' } };
    }

    // Check against configured valid codes from environment
    const validCodes = (process.env.UNLOCK_CODES || '').split(',').filter(Boolean);
    
    if (validCodes.length === 0) {
      this.logger.warn('No unlock codes configured — rejecting unlock attempt');
      return { success: false, error: { code: 'UNLOCK_UNAVAILABLE', message: 'Unlock codes not configured' } };
    }

    if (!validCodes.includes(body.code.trim())) {
      return { success: false, error: { code: 'WRONG_CODE', message: 'Invalid unlock code' } };
    }

    // Log the unlock attempt
    this.logger.log(`User ${req.user.id} unlocked storyworld: ${slug}`);
    
    return { success: true, data: { unlocked: true, slug } };
  }

  @Get(':slug/rooms')
  @ApiOperation({ summary: 'List rooms in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getRooms(
    @Param('slug') _slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.roomService.getRooms(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Post(':slug/rooms/:roomId/posts')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a room post' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  async createRoomPost(
    @Param('roomId') roomId: string,
    @Body() body: { content: string; spoilerLevel?: string; userAvatar?: string },
    @Request() req: { user: { id: string; displayName: string } }
  ) {
    return this.roomService.createRoomPost({
      roomId,
      content: body.content,
      authorId: req.user.id,
      authorName: req.user.displayName,
      authorAvatar: body.userAvatar,
      spoilerLevel: body.spoilerLevel || 'none',
    });
  }
}
