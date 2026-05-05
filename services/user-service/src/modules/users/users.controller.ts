import { Controller, Get, Patch, Body, UseGuards, Request, Put, Post, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto';
import { User } from './interfaces/user.interface';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any): Promise<User> {
    return this.usersService.findById(req.user.sub);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    return this.usersService.update(req.user.sub, updateUserDto);
  }

  @Get('me/preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@Request() req: any) {
    return this.usersService.getPreferences(req.user.sub);
  }

  @Put('me/preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @Request() req: any,
    @Body() preferences: Record<string, any>,
  ) {
    return this.usersService.updatePreferences(req.user.sub, preferences);
  }

  @Get('me/history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user watch history' })
  @ApiResponse({ status: 200, description: 'Watch history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(@Request() req: any) {
    return this.usersService.getWatchHistory(req.user.sub);
  }

  @Get('me/saved')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user saved items' })
  @ApiResponse({ status: 200, description: 'Saved items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSavedItems(@Request() req: any) {
    return this.usersService.getSavedItems(req.user.sub);
  }

  @Post('me/saved')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Save an item' })
  @ApiResponse({ status: 201, description: 'Item saved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveItem(@Request() req: any, @Body() body: { contentId: string }) {
    return this.usersService.saveItem(req.user.sub, body.contentId);
  }

  @Delete('me/saved/:contentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Unsave an item' })
  @ApiResponse({ status: 200, description: 'Item unsaved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unsaveItem(@Request() req: any, @Param('contentId') contentId: string) {
    return this.usersService.unsaveItem(req.user.sub, contentId);
  }

  @Get('me/universe-affinity')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUniverseAffinity(@Request() req: any) {
    return this.usersService.getUniverseAffinity(req.user.sub);
  }

  @Patch('me/universe-affinity')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update user universe affinity' })
  @ApiResponse({ status: 200, description: 'Universe affinity updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUniverseAffinity(
    @Request() req: any,
    @Body() dto: UpdateUniverseAffinityDto,
  ) {
    return this.usersService.updateUniverseAffinity(req.user.sub, dto);
  }
}
