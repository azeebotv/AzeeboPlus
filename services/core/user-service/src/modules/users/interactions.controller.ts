import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Interactions')
@Controller('interactions')
@UseGuards(AuthGuard('jwt'))
export class InteractionsController {
  constructor(private readonly usersService: UsersService) {}

  @Get('watchlist')
  @ApiOperation({ summary: 'Get user watchlist' })
  @ApiResponse({ status: 200, description: 'Watchlist items' })
  async getWatchlist(@Request() req: { user: { sub: string } }) {
    const result = await this.usersService.getSavedItems(req.user.sub, 1, 100);
    return { success: true, data: result.data?.items || [] };
  }

  @Delete('watchlist/:contentId')
  @ApiOperation({ summary: 'Remove from watchlist' })
  @ApiResponse({ status: 200, description: 'Removed from watchlist' })
  async removeFromWatchlist(
    @Request() req: { user: { sub: string } },
    @Param('contentId') contentId: string
  ) {
    await this.usersService.removeSavedItem(req.user.sub, contentId);
    return { success: true };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get watch history' })
  @ApiResponse({ status: 200, description: 'Watch history items' })
  async getHistory(@Request() req: { user: { sub: string } }) {
    const result = await this.usersService.getWatchHistory(req.user.sub, 1, 100);
    return { success: true, data: result.data?.items || [] };
  }

  @Delete('history/:contentId')
  @ApiOperation({ summary: 'Remove from watch history' })
  @ApiResponse({ status: 200, description: 'Removed from history' })
  async removeFromHistory(
    @Request() req: { user: { sub: string } },
    @Param('contentId') contentId: string
  ) {
    await this.usersService.removeWatchHistory(req.user.sub, contentId);
    return { success: true };
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorite items' })
  async getFavorites(@Request() req: { user: { sub: string } }) {
    const result = await this.usersService.getSavedItems(req.user.sub, 1, 100);
    return { success: true, data: result.data?.items || [] };
  }

  @Post('favorites')
  @ApiOperation({ summary: 'Add to favorites' })
  @ApiResponse({ status: 201, description: 'Added to favorites' })
  async addFavorite(
    @Request() req: { user: { sub: string } },
    @Body() body: { contentId: string }
  ) {
    await this.usersService.addSavedItem(req.user.sub, body.contentId);
    return { success: true };
  }

  @Delete('favorites/:contentId')
  @ApiOperation({ summary: 'Remove from favorites' })
  @ApiResponse({ status: 200, description: 'Removed from favorites' })
  async removeFavorite(
    @Request() req: { user: { sub: string } },
    @Param('contentId') contentId: string
  ) {
    await this.usersService.removeSavedItem(req.user.sub, contentId);
    return { success: true };
  }
}
