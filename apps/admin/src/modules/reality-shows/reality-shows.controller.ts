import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
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

  @Get('contestants')
  async getContestants() {
    try {
      const res = await fetch('http://localhost:3010/api/v1/reality/contestants');
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // fallback
    }
    return { contestants: [] };
  }

  @Get(':id')
  async getShow(@Param('id') id: string) {
    return this.showsService.getShow(id);
  }

  @Put(':id/status')
  async updateShowStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.showsService.updateShowStatus(id, status);
  }

  @Post()
  async createShow(
    @Body()
    body: {
      title: string;
      description?: string;
      creatorId?: string;
      thumbnail?: string;
      isExclusive?: boolean;
      isPremiere?: boolean;
    }
  ) {
    return this.showsService.createShow(body);
  }

  @Patch(':id')
  async updateShow(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: string;
      isExclusive?: boolean;
      isPremiere?: boolean;
    }
  ) {
    return this.showsService.updateShow(id, body);
  }

  @Delete(':id')
  async deleteShow(@Param('id') id: string) {
    return this.showsService.deleteShow(id);
  }
}
