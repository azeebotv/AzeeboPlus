import { Controller, Inject, Get, Patch, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RightsClearancesService } from './rights-clearances.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { resolveActorId } from '../../common/resolve-actor-id';

interface AuthRequest extends Request {
  user?: { id?: string; sub?: string; email?: string; role?: string };
}

@ApiTags('Admin Rights Clearances')
@ApiBearerAuth()
@Controller('admin/rights/clearances')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class RightsClearancesController {
  constructor(
    @Inject(RightsClearancesService)
    private readonly service: RightsClearancesService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List rights clearances with filters and search' })
  async list(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('expiry') expiry?: string
  ) {
    return this.service.list({ status, type, q, expiry });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update clearance status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Req() req: AuthRequest
  ) {
    const actorId = resolveActorId(req);
    return this.service.updateStatus(id, status, actorId);
  }
}
