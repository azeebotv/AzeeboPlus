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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto';
import { User } from './interfaces/user.interface';

interface AuthenticatedRequest {
  user: {
    sub: string;
  };
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: AuthenticatedRequest): Promise<User> {
    return this.usersService.findById(req.user.sub) as Promise<User>;
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.usersService.update(req.user.sub, updateUserDto) as Promise<User>;
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
  @ApiResponse({ status: 200, description: 'Watch history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(@Request() req: AuthenticatedRequest): Promise<unknown> {
    return this.usersService.getWatchHistory(req.user.sub);
  }

  @Get('me/saved')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user saved items' })
  @ApiResponse({ status: 200, description: 'Saved items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSavedItems(@Request() req: AuthenticatedRequest): Promise<unknown> {
    return this.usersService.getSavedItems(req.user.sub);
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
}
