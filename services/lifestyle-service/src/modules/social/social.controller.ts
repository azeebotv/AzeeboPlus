import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SocialService } from './social.service';

@ApiTags('Social')
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('save')
  @ApiOperation({ summary: 'Save an item' })
  @ApiResponse({ status: 201, description: 'Item saved' })
  async saveItem(
    @Body()
    body: {
      userId: string;
      itemType: string;
      itemId: string;
      note?: string;
    }
  ): Promise<unknown> {
    return this.socialService.saveItem(body);
  }

  @Delete('save')
  @ApiOperation({ summary: 'Unsave an item' })
  @ApiResponse({ status: 200, description: 'Item unsaved' })
  async unsaveItem(
    @Query('userId') userId: string,
    @Query('itemType') itemType: string,
    @Query('itemId') itemId: string
  ): Promise<unknown> {
    return this.socialService.unsaveItem(userId, itemType, itemId);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved items' })
  @ApiResponse({ status: 200, description: 'Saved items list' })
  async getSavedItems(
    @Query('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('itemType') itemType?: string
  ): Promise<unknown> {
    return this.socialService.getSavedItems(userId, Number(page), Number(limit), itemType);
  }

  @Get('saved/check')
  @ApiOperation({ summary: 'Check if item is saved' })
  @ApiResponse({ status: 200, description: 'Check result' })
  async isSaved(
    @Query('userId') userId: string,
    @Query('itemType') itemType: string,
    @Query('itemId') itemId: string
  ): Promise<unknown> {
    return this.socialService.isSaved(userId, itemType, itemId);
  }

  @Post('share')
  @ApiOperation({ summary: 'Share an item' })
  @ApiResponse({ status: 201, description: 'Share recorded' })
  async shareItem(
    @Body()
    body: {
      userId: string;
      itemType: string;
      itemId: string;
      platform: string;
    }
  ): Promise<unknown> {
    return this.socialService.shareItem(body);
  }

  @Get('share/count')
  @ApiOperation({ summary: 'Get share count' })
  @ApiResponse({ status: 200, description: 'Share count' })
  async getShareCount(
    @Query('itemType') itemType: string,
    @Query('itemId') itemId: string
  ): Promise<unknown> {
    return this.socialService.getShareCount(itemType, itemId);
  }
}
