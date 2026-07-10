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
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CompleteProfileSetupDto } from './dto/complete-profile-setup.dto';
import { ContentIdDto } from './dto/content-id.dto';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';

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
  constructor(private readonly usersService: UsersService) {}

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return userId;
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
    return this.usersService.followUser(this.getUserId(req), id);
  }

  @Delete(':id/follow')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.unfollowUser(this.getUserId(req), id);
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
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.usersService.getWatchHistory(this.getUserId(req), Number(page), Number(limit));
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
    return this.usersService.getSavedItems(this.getUserId(req), Number(page), Number(limit));
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
  @ApiOperation({ summary: 'Get user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUniverseAffinity(@Request() req: AuthenticatedRequest) {
    const result = await this.usersService.getUniverseAffinity(this.getUserId(req));
    return ApiResponseWrapper.success(result);
  }

  @Patch('me/universe-affinity')
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
  @ApiOperation({ summary: 'Get continue watching list' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Continue watching items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContinueWatching(@Request() req: AuthenticatedRequest, @Query('limit') limit = 10) {
    const result = await this.usersService.getContinueWatching(this.getUserId(req), Number(limit));
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
