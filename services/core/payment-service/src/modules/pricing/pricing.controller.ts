import { Inject, Controller, Get, Param  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PricingService } from './pricing.service.js';

@ApiTags('Pricing')
@Controller('v1/pricing')
export class PricingController {
  constructor(@Inject(PricingService) private readonly pricingService: PricingService) {}

  @Get('movie')
  @ApiOperation({ summary: 'Get movie pricing' })
  async getMoviePricing() {
    return this.pricingService.getMoviePricing();
  }

  @Get('vote-packages/:type')
  @ApiOperation({ summary: 'Get vote packages' })
  @ApiParam({ name: 'type', description: 'Vote type (standard, reality, superVote)' })
  async getVotePackages(@Param('type') type: string) {
    return this.pricingService.getVotePackages(type);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get subscription plans' })
  async getSubscriptionPlans() {
    return this.pricingService.getSubscriptionPlans();
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet pricing and limits' })
  async getWalletPricing() {
    return this.pricingService.getWalletPricing();
  }

  @Get('passes')
  @ApiOperation({ summary: 'Get content passes pricing' })
  async getPassesPricing() {
    return this.pricingService.getPassesPricing();
  }
}
