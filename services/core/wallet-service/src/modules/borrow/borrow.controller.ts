import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, RateLimit, RateLimitGuard } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { BorrowService } from './borrow.service.js';

/**
 * Public Borrow surface: the approved-partner listing behind the web page.
 * Read-only and anonymous — applications happen on the partner's own site, so
 * nothing here is user-specific and no write route exists on this controller.
 */
@ApiTags('Borrow')
@Controller('borrow')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  @Get('banks')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'List active lending partners with full offer disclosures' })
  @ApiResponse({ status: 200, description: 'Active partner banks in display order' })
  async listPartnerBanks() {
    const banks = await this.borrowService.listActivePartnerBanks();
    return ApiResponseWrapper.success(banks);
  }

  @Get('banks/:slug')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get one active lending partner by slug' })
  @ApiResponse({ status: 200, description: 'Partner bank offer' })
  @ApiResponse({ status: 404, description: 'Partner bank not found' })
  async getPartnerBank(@Param('slug') slug: string) {
    const bank = await this.borrowService.getActivePartnerBank(slug);
    return ApiResponseWrapper.success(bank);
  }
}
