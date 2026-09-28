import {
  Inject,
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
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { UsersService } from './users.service.js';
import { AvatarService } from './avatar.service.js';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';
import { CompleteProfileSetupDto } from './dto/complete-profile-setup.dto.js';
import { ContentIdDto } from './dto/content-id.dto.js';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { FeatureFlag, FeatureFlagGuard, userFlags } from '@azeebo/feature-flags';

interface AuthenticatedRequest {
  user: {
    sub: string;
    role: string;
    email?: string;
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(AvatarService) private readonly avatarService: AvatarService
  ) {}

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return userId;
  }
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 3600000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload avatar image' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new UnauthorizedException('No file provided');
    }
    const result = await this.avatarService.uploadAvatar(this.getUserId(req), {
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
      originalname: file.originalname,
    });
    return { success: true, data: result };
  }

  @Delete('me/avatar')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 3600000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete avatar image' })
  @ApiResponse({ status: 200, description: 'Avatar deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAvatar(@Request() req: AuthenticatedRequest) {
    await this.avatarService.deleteAvatar(this.getUserId(req));
    return { success: true };
  }

  @Get('me/avatar/upload-url')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Get pre-signed upload URL for avatar' })
  @ApiResponse({ status: 200, description: 'Upload URL generated' })
  async getAvatarUploadUrl(
    @Request() req: AuthenticatedRequest,
    @Query('format') format: string = 'image/jpeg'
  ) {
    const result = await this.avatarService.getUploadUrl(this.getUserId(req), format);
    return { success: true, data: result };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(this.getUserId(req));
  }

  @Patch('me')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req: AuthenticatedRequest, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateProfile(this.getUserId(req), dto);
  }

  // Wildcard GET route MUST come after all static GET routes
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
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(userFlags.followSystem)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'User followed' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async followUser(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.followUser(this.getUserId(req), id);
  }

  @Delete(':id/follow')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(userFlags.followSystem)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.unfollowUser(this.getUserId(req), id);
  }

  @Public()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(userFlags.followSystem)
  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User followers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowers(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    return this.usersService.getFollowers(id, Number(page), safeLimit);
  }

  @Public()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(userFlags.followSystem)
  @Get(':id/following')
  @ApiOperation({ summary: 'Get users being followed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users being followed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowing(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    return this.usersService.getFollowing(id, Number(page), safeLimit);
  }

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@Request() req: AuthenticatedRequest): Promise<Record<string, unknown>> {
    return this.usersService.getPreferences(this.getUserId(req));
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
    return this.usersService.updatePreferences(this.getUserId(req), preferences);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Get user watch history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Watch history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<unknown> {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    return this.usersService.getWatchHistory(this.getUserId(req), Number(page), safeLimit);
  }

  @Post('me/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a watch-history entry (upsert)' })
  @ApiResponse({ status: 200, description: 'Watch history updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addToWatchHistory(
    @Request() req: AuthenticatedRequest,
    @Body() body: { contentId: string; contentType?: string; universe?: string }
  ): Promise<unknown> {
    if (!body?.contentId) {
      return { success: false, message: 'contentId is required' };
    }
    await this.usersService.addWatchHistoryEntry(this.getUserId(req), body);
    return { success: true, message: 'Watch history updated' };
  }

  @Get('me/saved')
  @ApiOperation({ summary: 'Get user saved items' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Saved items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSavedItems(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<unknown> {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    return this.usersService.getSavedItems(this.getUserId(req), Number(page), safeLimit);
  }

  @Post('me/saved')
  @ApiOperation({ summary: 'Save an item' })
  @ApiResponse({ status: 201, description: 'Item saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveItem(
    @Request() req: AuthenticatedRequest,
    @Body() body: ContentIdDto
  ): Promise<{ message: string }> {
    return this.usersService.saveItem(this.getUserId(req), body.contentId);
  }

  @Delete('me/saved/:contentId')
  @ApiOperation({ summary: 'Unsave an item' })
  @ApiResponse({ status: 200, description: 'Item unsaved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unsaveItem(
    @Request() req: AuthenticatedRequest,
    @Param('contentId') contentId: string
  ): Promise<{ message: string }> {
    return this.usersService.unsaveItem(this.getUserId(req), contentId);
  }

  @Get('me/universe-affinity')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(userFlags.universeAffinity)
  @ApiOperation({ summary: 'Get user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUniverseAffinity(@Request() req: AuthenticatedRequest) {
    const result = await this.usersService.getUniverseAffinity(this.getUserId(req));
    return ApiResponseWrapper.success(result);
  }

  @Patch('me/universe-affinity')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(userFlags.universeAffinity)
  @ApiOperation({ summary: 'Update user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUniverseAffinity(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateUniverseAffinityDto
  ) {
    const result = await this.usersService.updateUniverseAffinity(this.getUserId(req), dto);
    return ApiResponseWrapper.success(result);
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
  ) {
    const result = await this.usersService.completeProfileSetup(
      this.getUserId(req),
      dto,
      req.user.email
    );
    return ApiResponseWrapper.success((result as { data: unknown }).data ?? result);
  }

  @Get('me/privacy-settings')
  @ApiOperation({ summary: 'Get user privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPrivacySettings(@Request() req: AuthenticatedRequest) {
    const result = await this.usersService.getPrivacySettings(this.getUserId(req));
    return ApiResponseWrapper.success((result as { data: unknown }).data ?? result);
  }

  @Get('me/continue-watching')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(userFlags.continueWatching)
  @ApiOperation({ summary: 'Get continue watching list' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Continue watching items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContinueWatching(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit: number = 10
  ) {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 50);
    const result = await this.usersService.getContinueWatching(this.getUserId(req), safeLimit);
    return ApiResponseWrapper.success((result as { data: unknown }).data ?? result);
  }

  @Get('me/universes')
  @ApiOperation({ summary: 'Get user universe engagement' })
  @ApiResponse({ status: 200, description: 'Universe engagement list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUniverses(@Request() req: AuthenticatedRequest) {
    const result = await this.usersService.getUniverseEngagement(this.getUserId(req));
    return ApiResponseWrapper.success((result as { data: unknown }).data ?? result);
  }

  @Put('me/privacy-settings')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(userFlags.privacySettingsV2)
  @ApiOperation({ summary: 'Update user privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePrivacySettings(
    @Request() req: AuthenticatedRequest,
    @Body() settings: Record<string, unknown>
  ) {
    const result = await this.usersService.updatePrivacySettings(this.getUserId(req), settings);
    return ApiResponseWrapper.success((result as { data: unknown }).data ?? result);
  }
}
