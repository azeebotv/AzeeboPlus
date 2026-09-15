import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DualControlService } from './dual-control.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { resolveActorId } from '../../common/resolve-actor-id';

interface AuthRequest extends Request {
  user?: { id?: string; sub?: string; email?: string; role?: string };
}

@ApiTags('Admin Dual Control')
@ApiBearerAuth()
@Controller('admin/dual-control')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class DualControlController {
  constructor(private readonly service: DualControlService) {}

  @Get()
  @ApiOperation({ summary: 'List dual-control requests with stats' })
  async list(@Query('status') status?: string) {
    return this.service.list({ status });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a dual-control request for a high-risk operation' })
  async create(
    @Body()
    body: {
      actionType: string;
      description: string;
      amount?: number | string;
      currency?: string;
      targetUserIds?: string[];
    },
    @Req() req: AuthRequest
  ) {
    const actorId = resolveActorId(req);
    return this.service.create(
      {
        actionType: body.actionType,
        description: body.description,
        amount: body.amount,
        currency: body.currency,
        targetUserIds: body.targetUserIds,
      },
      actorId
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a dual-control request (two distinct admins required)' })
  async approve(@Param('id') id: string, @Req() req: AuthRequest) {
    const actorId = resolveActorId(req);
    return this.service.approve(id, actorId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a dual-control request with a reason' })
  async reject(@Param('id') id: string, @Body('reason') reason: string, @Req() req: AuthRequest) {
    const actorId = resolveActorId(req);
    return this.service.reject(id, reason, actorId);
  }
}
