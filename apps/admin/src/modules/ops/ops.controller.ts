import { Inject, Controller, Get } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsService, OpsStatus } from './ops.service';

@Controller('admin/ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class OpsController {
  constructor(@Inject(OpsService) private readonly opsService: OpsService) {}

  @Get('status')
  getStatus(): Promise<OpsStatus> {
    return this.opsService.getStatus();
  }
}
