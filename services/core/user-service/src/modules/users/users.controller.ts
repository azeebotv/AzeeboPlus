import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Put,
  Post,
  Delete,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CompleteProfileSetupDto } from './dto/complete-profile-setup.dto';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';

interface AuthenticatedRequest {
  user: {
    id: string;
    sub?: string;
    role?: string;
    email?: string;
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req: AuthenticatedRequest, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post(':id/follow')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'User followed' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async followUser(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.followUser(req.user.id, id);
  }

  @Delete(':id/follow')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.unfollowUser(req.user.id, id);
  }

  @Public()
  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User followers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowers(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.getFollowers(id, Number(page), Number(limit));
  }

  @Public()
  @Get(':id/following')
  @ApiOperation({ summary: 'Get users being followed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users being followed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowing(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.getFollowing(id, Number(page), Number(limit));
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@Request() req: AuthenticatedRequest): Promise<Record<string, unknown>> {
    return this.usersService.getPreferences(req.user.id);
  }

  @Put('me/preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @Request() req: AuthenticatedRequest,
    @Body() preferences: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.usersService.updatePreferences(req.user.id, preferences);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Get user watch history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Watch history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.usersService.getWatchHistory(req.user.id, Number(page), Number(limit));
  }

  @Get('me/saved')
  @ApiOperation({ summary: 'Get user saved items' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Saved items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSavedItems(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.usersService.getSavedItems(req.user.id, Number(page), Number(limit));
  }

  @Post('me/saved')
  @ApiOperation({ summary: 'Save an item' })
  @ApiResponse({ status: 201, description: 'Item saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveItem(
    @Request() req: AuthenticatedRequest,
    @Body() body: { contentId: string }
  ): Promise<{ message: string }> {
    return this.usersService.saveItem(req.user.id, body.contentId);
  }

  @Delete('me/saved/:contentId')
  @ApiOperation({ summary: 'Unsave an item' })
  @ApiResponse({ status: 200, description: 'Item unsaved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unsaveItem(
    @Request() req: AuthenticatedRequest,
    @Param('contentId') contentId: string
  ): Promise<{ message: string }> {
    return this.usersService.unsaveItem(req.user.id, contentId);
  }

  @Get('watch-history')
  @ApiOperation({ summary: 'Get watch history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Watch history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWatchHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    throw new HttpException(
      { message: 'Not yet implemented', feature: 'user-watch-history' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Post('watch-history')
  @ApiOperation({ summary: 'Add to watch history' })
  @ApiResponse({ status: 201, description: 'Added to watch history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addToWatchHistory(
    @Request() req: AuthenticatedRequest,
    @Body() body: { contentId: string }
  ): Promise<{ message: string }> {
    throw new HttpException(
      { message: 'Not yet implemented', feature: 'user-watch-history' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved content' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Saved content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSaved(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    throw new HttpException(
      { message: 'Not yet implemented', feature: 'user-saved' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Post('saved')
  @ApiOperation({ summary: 'Save content' })
  @ApiResponse({ status: 201, description: 'Content saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveContent(
    @Request() req: AuthenticatedRequest,
    @Body() body: { contentId: string }
  ): Promise<{ message: string }> {
    throw new HttpException(
      { message: 'Not yet implemented', feature: 'user-saved' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Delete('saved/:contentId')
  @ApiOperation({ summary: 'Remove saved content' })
  @ApiResponse({ status: 200, description: 'Saved content removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeSaved(
    @Request() req: AuthenticatedRequest,
    @Param('contentId') contentId: string
  ): Promise<{ message: string }> {
    throw new HttpException(
      { message: 'Not yet implemented', feature: 'user-saved' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Get('me/universe-affinity')
  @ApiOperation({ summary: 'Get user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUniverseAffinity(@Request() req: AuthenticatedRequest): Promise<unknown> {
    return this.usersService.getUniverseAffinity(req.user.id);
  }

  @Patch('me/universe-affinity')
  @ApiOperation({ summary: 'Update user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUniverseAffinity(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateUniverseAffinityDto
  ): Promise<{ message: string; interests: string[] }> {
    return this.usersService.updateUniverseAffinity(req.user.id, dto);
  }

  @Post('me/complete-profile')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiOperation({ summary: 'Complete profile setup after registration' })
  @ApiResponse({ status: 200, description: 'Profile setup completed' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeProfileSetup(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CompleteProfileSetupDto
  ): Promise<Record<string, unknown>> {
    return this.usersService.completeProfileSetup(req.user.id, dto, req.user.email);
  }

  @Get('me/privacy-settings')
  @ApiOperation({ summary: 'Get user privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPrivacySettings(@Request() req: AuthenticatedRequest): Promise<Record<string, unknown>> {
    return this.usersService.getPrivacySettings(req.user.id);
  }

  @Get('me/continue-watching')
  @ApiOperation({ summary: 'Get continue watching list' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Continue watching items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContinueWatching(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit = 10
  ): Promise<unknown> {
    return this.usersService.getContinueWatching(req.user.id, Number(limit));
  }

  @Get('me/universes')
  @ApiOperation({ summary: 'Get user universe engagement' })
  @ApiResponse({ status: 200, description: 'Universe engagement list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUniverses(@Request() req: AuthenticatedRequest): Promise<unknown> {
    return this.usersService.getUniverseEngagement(req.user.id);
  }

  @Put('me/privacy-settings')
  @ApiOperation({ summary: 'Update user privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePrivacySettings(
    @Request() req: AuthenticatedRequest,
    @Body() settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.usersService.updatePrivacySettings(req.user.id, settings);
  }
}
