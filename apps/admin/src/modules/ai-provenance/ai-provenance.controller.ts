import { Controller, Inject, Get, Patch, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiProvenanceService } from './ai-provenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { resolveActorId } from '../../common/resolve-actor-id';

interface AuthRequest extends Request {
  user?: { id?: string; sub?: string; email?: string; role?: string };
}

@ApiTags('Admin AI Provenance')
@ApiBearerAuth()
@Controller('admin/ai-provenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AiProvenanceController {
  constructor(
    @Inject(AiProvenanceService)
    private readonly service: AiProvenanceService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List AI provenance records with filters' })
  async list(@Query('status') status?: string, @Query('type') type?: string) {
    return this.service.list({ status, type });
  }

  @Patch(':id/clearance')
  @ApiOperation({ summary: 'Set clearance decision for a provenance record' })
  async setClearance(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Body('notes') notes: string,
    @Req() req: AuthRequest
  ) {
    const actorId = resolveActorId(req);
    return this.service.setClearance(id, status, notes, actorId);
  }
}
