import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
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
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions list' })
  async getUserSubscriptions(@Request() req: { user: { sub: string } }): Promise<unknown> {
    return this.cinemaPassService.getUserSubscriptions(req.user.sub);
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Subscribe to a pass' })
  @ApiResponse({ status: 201, description: 'Subscribed' })
  async subscribe(
    @Body() body: { passId: string; autoRenew?: boolean },
    @Request() req: { user: { sub: string } }
  ): Promise<unknown> {
    return this.cinemaPassService.subscribe(req.user.sub, body.passId, body.autoRenew);
  }

  @Delete('cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Cancelled' })
  async cancelSubscription(
    @Query('passId') passId: string,
    @Request() req: { user: { sub: string } }
  ): Promise<unknown> {
    return this.cinemaPassService.cancelSubscription(req.user.sub, passId);
  }

  @Get('access/:movieId')
  @ApiOperation({ summary: 'Check access to movie' })
  @ApiResponse({ status: 200, description: 'Access status' })
  async checkAccess(
    @Param('movieId') movieId: string,
    @Query('userId') userId: string
  ): Promise<unknown> {
    return this.cinemaPassService.checkAccess(userId, movieId);
  }
}
