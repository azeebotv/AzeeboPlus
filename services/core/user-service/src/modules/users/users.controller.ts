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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CompleteProfileSetupDto } from './dto/complete-profile-setup.dto';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

interface AuthenticatedRequest {
  user: {
    sub: string;
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req: AuthenticatedRequest, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post(':id/follow')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'User followed' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async followUser(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.followUser(req.user.sub, id);
  }

  @Delete(':id/follow')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollowUser(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.unfollowUser(req.user.sub, id);
  }

  @Get(':id/followers')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user followers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User followers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowers(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.getFollowers(id, Number(page), Number(limit));
  }

  @Get(':id/following')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get users being followed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users being followed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowing(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.getFollowing(id, Number(page), Number(limit));
  }

  @Get('me/preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@Request() req: AuthenticatedRequest): Promise<Record<string, unknown>> {
    return this.usersService.getPreferences(req.user.sub);
  }

  @Put('me/preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @Request() req: AuthenticatedRequest,
    @Body() preferences: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.usersService.updatePreferences(req.user.sub, preferences);
  }

  @Get('me/history')
  @UseGuards(AuthGuard('jwt'))
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
    return this.usersService.getWatchHistory(req.user.sub, Number(page), Number(limit));
  }

  @Get('me/saved')
  @UseGuards(AuthGuard('jwt'))
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
    return this.usersService.getSavedItems(req.user.sub, Number(page), Number(limit));
  }

  @Post('me/saved')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Save an item' })
  @ApiResponse({ status: 201, description: 'Item saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveItem(
    @Request() req: AuthenticatedRequest,
    @Body() body: { contentId: string }
  ): Promise<{ message: string }> {
    return this.usersService.saveItem(req.user.sub, body.contentId);
  }

  @Delete('me/saved/:contentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Unsave an item' })
  @ApiResponse({ status: 200, description: 'Item unsaved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unsaveItem(
    @Request() req: AuthenticatedRequest,
    @Param('contentId') contentId: string
  ): Promise<{ message: string }> {
    return this.usersService.unsaveItem(req.user.sub, contentId);
  }

  @Get('me/universe-affinity')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUniverseAffinity(@Request() req: AuthenticatedRequest): Promise<unknown> {
    return this.usersService.getUniverseAffinity(req.user.sub);
  }

  @Patch('me/universe-affinity')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUniverseAffinity(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateUniverseAffinityDto
  ): Promise<{ message: string; interests: string[] }> {
    return this.usersService.updateUniverseAffinity(req.user.sub, dto);
  }

  @Post('me/complete-profile')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiOperation({ summary: 'Complete profile setup after registration' })
  @ApiResponse({ status: 200, description: 'Profile setup completed' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeProfileSetup(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CompleteProfileSetupDto
  ): Promise<Record<string, unknown>> {
    return this.usersService.completeProfileSetup(req.user.sub, dto);
  }
}
