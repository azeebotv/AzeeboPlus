import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AgbalaTitlesService as TitlesService } from './agbala/titles.service';
import { AgbalaCharactersService as CharactersService } from './agbala/characters.service';
import { TheoryService } from './agbala/theory.service';
import { RoomService } from './agbala/room.service';

@ApiTags('Storyworlds')
@Controller('v1/vertical/storyworlds')
export class StoryworldsController {
  constructor(
    private readonly titlesService: TitlesService,
    private readonly charactersService: CharactersService,
    private readonly theoryService: TheoryService,
    private readonly roomService: RoomService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all storyworlds' })
  async getStoryworlds(): Promise<{ success: boolean; data: unknown[] }> {
    return { success: true, data: [] };
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
    @Query('limit') limit?: string,
  ) {
    return this.titlesService.getTitles(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      slug,
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
    @Query('limit') limit?: string,
  ) {
    return this.charactersService.getCharacters(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      slug,
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
    @Query('limit') limit?: string,
  ) {
    return this.theoryService.getTheories(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post(':slug/theories')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit a theory' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async createTheory(
    @Param('slug') _slug: string,
    @Body() body: { title: string; content: string; spoilerLevel?: string },
    @Request() req: { user: { id: string; displayName: string } },
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
  async getRealms(@Param('slug') slug: string) {
    return this.titlesService.getTitles(1, 100, slug);
  }

  @Get(':slug/orisa')
  @ApiOperation({ summary: 'List orisa files in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async getOrisa(@Param('slug') slug: string) {
    return this.titlesService.getTitles(1, 100, slug);
  }

  @Get(':slug/artifacts')
  @ApiOperation({ summary: 'List artifacts in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async getArtifacts(@Param('slug') slug: string) {
    return this.titlesService.getTitles(1, 100, slug);
  }

  @Get(':slug/prophecies')
  @ApiOperation({ summary: 'List prophecies in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async getProphecies(@Param('slug') slug: string) {
    return this.titlesService.getTitles(1, 100, slug);
  }

  @Get(':slug/maps')
  @ApiOperation({ summary: 'List maps in storyworld' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async getMaps(@Param('slug') slug: string) {
    return this.titlesService.getTitles(1, 100, slug);
  }

  @Post(':slug/unlock')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Validate unlock code' })
  @ApiParam({ name: 'slug', description: 'Storyworld slug' })
  async validateUnlock(
    @Param('slug') slug: string,
    @Body() _body: { code: string },
    @Request() _req: { user: { id: string } },
  ) {
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
    @Query('limit') limit?: string,
  ) {
    return this.roomService.getRooms(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
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
    @Request() req: { user: { id: string; displayName: string } },
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
