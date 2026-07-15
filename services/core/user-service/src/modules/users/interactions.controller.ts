import {
  Inject,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { ContentIdDto } from './dto/content-id.dto.js';

@ApiTags('Interactions')
@Controller('interactions')
export class InteractionsController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get('watchlist')
  @ApiOperation({ summary: 'Get user watchlist' })
  @ApiResponse({ status: 200, description: 'Watchlist items' })
  async getWatchlist(@Request() req: { user: { id: string } }) {
    const result = await this.usersService.getSavedItems(req.user.id, 1, 100);
    return { success: true, data: (result as Record<string, unknown>).data || [] };
  }

  @Delete('watchlist/:contentId')
  @ApiOperation({ summary: 'Remove from watchlist' })
  @ApiResponse({ status: 200, description: 'Removed from watchlist' })
  async removeFromWatchlist(
    @Request() req: { user: { id: string } },
    @Param('contentId') contentId: string
  ) {
    await this.usersService.unsaveItem(req.user.id, contentId);
    return { success: true };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get watch history' })
  @ApiResponse({ status: 200, description: 'Watch history items' })
  async getHistory(@Request() req: { user: { id: string } }) {
    const result = await this.usersService.getWatchHistory(req.user.id, 1, 100);
    return { success: true, data: (result as Record<string, unknown>).data || [] };
  }

  @Delete('history/:contentId')
  @ApiOperation({ summary: 'Remove from watch history' })
  @ApiResponse({ status: 200, description: 'Removed from history' })
  async removeFromHistory(
    @Request() req: { user: { id: string } },
    @Param('contentId') contentId: string
  ) {
    const userId = req.user.id;
    await this.usersService.removeFromWatchHistory(userId, contentId);
    return { success: true, message: 'Removed from watch history' };
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorite items' })
  async getFavorites(@Request() req: { user: { id: string } }) {
    const result = await this.usersService.getSavedItems(req.user.id, 1, 100);
    return { success: true, data: (result as Record<string, unknown>).data || [] };
  }

  @Post('favorites')
  @ApiOperation({ summary: 'Add to favorites' })
  @ApiResponse({ status: 201, description: 'Added to favorites' })
  async addFavorite(@Request() req: { user: { id: string } }, @Body() body: ContentIdDto) {
    await this.usersService.saveItem(req.user.id, body.contentId);
    return { success: true };
  }

  @Delete('favorites/:contentId')
  @ApiOperation({ summary: 'Remove from favorites' })
  @ApiResponse({ status: 200, description: 'Removed from favorites' })
  async removeFavorite(
    @Request() req: { user: { id: string } },
    @Param('contentId') contentId: string
  ) {
    await this.usersService.unsaveItem(req.user.id, contentId);
    return { success: true };
  }
}
