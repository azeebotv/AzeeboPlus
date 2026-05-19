import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CinemaPassService } from './cinema-pass.service';

@ApiTags('Cinema Pass')
@Controller('v1/movies/passes')
export class CinemaPassController {
  constructor(private readonly cinemaPassService: CinemaPassService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cinema passes' })
  @ApiResponse({ status: 200, description: 'Passes list' })
  async getPasses(): Promise<unknown> {
    return this.cinemaPassService.getPasses();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pass by id' })
  @ApiResponse({ status: 200, description: 'Pass details' })
  async getPass(@Param('id') id: string): Promise<unknown> {
    return this.cinemaPassService.getPassById(id);
  }

  @Get('user/subscriptions')
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions list' })
  async getUserSubscriptions(@Query('userId') userId: string): Promise<unknown> {
    return this.cinemaPassService.getUserSubscriptions(userId);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a pass' })
  @ApiResponse({ status: 201, description: 'Subscribed' })
  async subscribe(
    @Body() body: { userId: string; passId: string; autoRenew?: boolean }
  ): Promise<unknown> {
    return this.cinemaPassService.subscribe(body.userId, body.passId, body.autoRenew);
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Cancelled' })
  async cancelSubscription(
    @Query('userId') userId: string,
    @Query('passId') passId: string
  ): Promise<unknown> {
    return this.cinemaPassService.cancelSubscription(userId, passId);
  }

  @Get('access/:movieId')
  @ApiOperation({ summary: 'Check access to movie' })
  @ApiResponse({ status: 200, description: 'Access status' })
  async checkAccess(
    @Query('userId') userId: string,
    @Param('movieId') movieId: string
  ): Promise<unknown> {
    return this.cinemaPassService.checkAccess(userId, movieId);
  }
}
