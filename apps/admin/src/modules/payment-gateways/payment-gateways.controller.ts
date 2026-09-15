import { Controller, Get, Put, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { PaymentGatewaysService } from './payment-gateways.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/payment-gateways')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class PaymentGatewaysController {
  constructor(private readonly gatewaysService: PaymentGatewaysService) {}

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
  async updateGatewayMode(@Param('id') id: string, @Body('mode') mode: 'live' | 'test') {
    const result = await this.gatewaysService.updateGatewayMode(id, mode);
    if (!result) throw new NotFoundException(`Unknown gateway: ${id}`);
    return result;
  }
}
