import { Inject, Controller, Get, UseGuards  } from '@nestjs/common';
import { PlatformOverviewService } from './platform-overview.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PlatformOverviewController {
  constructor(@Inject(PlatformOverviewService) private readonly overviewService: PlatformOverviewService) {}

  @Get('overview')
  async getOverview() {
    return this.overviewService.getOverview();
  }
}
