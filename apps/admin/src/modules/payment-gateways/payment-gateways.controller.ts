import { Inject, Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentGatewaysService } from './payment-gateways.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/payment-gateways')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class PaymentGatewaysController {
  constructor(
    @Inject(PaymentGatewaysService) private readonly gatewaysService: PaymentGatewaysService
  ) {}

  @Get()
  async getGateways() {
    return this.gatewaysService.getGateways();
  }

  @Put(':id/toggle')
  async toggleGateway(@Param('id') id: string) {
    return this.gatewaysService.toggleGateway(id);
  }

  @Put(':id/mode')
  async updateGatewayMode(@Param('id') id: string, @Body('mode') mode: string) {
    return this.gatewaysService.updateGatewayMode(id, mode);
  }
}
