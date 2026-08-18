import { Inject, Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { RealityShowsService } from './reality-shows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/reality-shows')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class RealityShowsController {
  constructor(@Inject(RealityShowsService) private readonly showsService: RealityShowsService) {}

  @Get()
  async getShows() {
    return this.showsService.getShows();
  }

  @Put(':id/status')
  async updateShowStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.showsService.updateShowStatus(id, status);
  }
}
