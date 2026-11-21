import { Controller, Inject, Get, Put, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { PaymentGatewaysService } from './payment-gateways.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireDualControl } from '../dual-control/require-dual-control.decorator';

@Controller('admin/payment-gateways')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class PaymentGatewaysController {
  constructor(
    @Inject(PaymentGatewaysService)
    private readonly gatewaysService: PaymentGatewaysService
  ) {}

  @Get()
  async getGateways() {
    return this.gatewaysService.getGateways();
  }

  @Put(':id/toggle')
  async toggleGateway(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    const result = await this.gatewaysService.toggleGateway(id, enabled !== false);
    if (!result) throw new NotFoundException(`Unknown gateway: ${id}`);
    return result;
  }

  @Put(':id/mode')
  @RequireDualControl({ actionType: 'bulk_operation', description: 'Switching payment gateway live mode' })
  async updateGatewayMode(@Param('id') id: string, @Body('mode') mode: 'live' | 'test') {
    const result = await this.gatewaysService.updateGatewayMode(id, mode);
    if (!result) throw new NotFoundException(`Unknown gateway: ${id}`);
    return result;
  }

  @Get(':id/webhooks')
  async getWebhooks(@Param('id') id: string) {
    return this.gatewaysService.getWebhookEvents(id);
  }
}
