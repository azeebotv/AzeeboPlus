import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserManagementService } from './user-management.service';
import { AuditLogService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { resolveActorId } from '../../common/resolve-actor-id';
import { RequireDualControl } from '../dual-control/require-dual-control.decorator';

interface AuthRequest extends Request {
  user: { id?: string; sub?: string; email: string; role: string };
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class UserManagementController {
  constructor(
    @Inject(UserManagementService) private readonly userService: UserManagementService,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService
  ) {}

  @Get()
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
    @Query('search') search?: string
  ): Promise<unknown> {
    return this.userService.getUsers(Number(page), Number(limit), role, search);
  }

  @Get('stats')
  async getUserStats(): Promise<unknown> {
    return this.userService.getUserStats();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<unknown> {
    return this.userService.getUserById(id);
  }

  @Post()
  async createUser(
    @Req() req: AuthRequest,
    @Body()
    body: {
      email: string;
      displayName: string;
      password?: string;
      role?: string;
      isVerified?: boolean;
    }
  ): Promise<unknown> {
    const actorId = resolveActorId(req);
    const result = await this.userService.createUser(body as any);
    await this.auditLogService.log({
      actorId,
      action: 'user.created',
      targetType: 'user',
      targetId: (result as any)?.id,
      details: { email: body.email, role: body.role },
      ipAddress: req.ip,
    });
    return result;
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body()
    body: {
      displayName?: string;
      email?: string;
      role?: string;
      isVerified?: boolean;
    }
  ): Promise<unknown> {
    const actorId = resolveActorId(req);
    const result = await this.userService.updateUser(id, body as any);
    await this.auditLogService.log({
      actorId,
      action: 'user.updated',
      targetType: 'user',
      targetId: id,
      details: body,
      ipAddress: req.ip,
    });
    return result;
  }

  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: { role: string }
  ): Promise<unknown> {
    const result = await this.userService.updateUserRole(id, body.role);
    await this.auditLogService.log({
      actorId: resolveActorId(req),
      action: 'user.role.updated',
      targetType: 'user',
      targetId: id,
      details: { role: body.role },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('bulk/suspend')
  @RequireDualControl({ actionType: 'bulk_operation', description: 'Bulk suspension of user accounts' })
  async bulkSuspendUsers(
    @Req() req: AuthRequest,
    @Body() body: { ids: string[]; reason: string; durationDays?: number }
  ): Promise<unknown> {
    const actorId = resolveActorId(req);
    const result = await this.userService.bulkSuspend(
      body.ids || [],
      body.reason || 'Bulk suspended by admin',
      actorId,
      body.durationDays,
      req.ip
    );
    await this.auditLogService.log({
      actorId,
      action: 'user.bulk_suspended',
      targetType: 'user',
      details: { count: body.ids?.length, reason: body.reason, durationDays: body.durationDays },
      ipAddress: req.ip,
    });
    return result;
  }

  @Put(':id/suspend')
  async suspendUser(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: { reason: string; durationDays?: number }
  ): Promise<unknown> {
    const actorId = resolveActorId(req);
    const result = await this.userService.suspendUser(id, body.reason, actorId, body.durationDays);
    await this.auditLogService.log({
      actorId,
      action: 'user.suspended',
      targetType: 'user',
      targetId: id,
      details: { reason: body.reason, durationDays: body.durationDays },
      ipAddress: req.ip,
    });
    return result;
  }

  @Put(':id/suspension/revoke')
  async revokeSuspension(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: { reason: string }
  ): Promise<unknown> {
    const actorId = resolveActorId(req);
    const result = await this.userService.revokeSuspension(id, actorId, body.reason);
    await this.auditLogService.log({
      actorId,
      action: 'user.suspension.revoked',
      targetType: 'user',
      targetId: id,
      details: { reason: body.reason },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post(':id/verify')
  async verifyCreator(@Param('id') id: string, @Req() req: AuthRequest): Promise<unknown> {
    const actorId = resolveActorId(req);
    const result = await this.userService.setCreatorVerified(id, true, actorId, req.ip);
    await this.auditLogService.log({
      actorId,
      action: 'creator.verified',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Post(':id/unverify')
  async unverifyCreator(@Param('id') id: string, @Req() req: AuthRequest): Promise<unknown> {
    const actorId = resolveActorId(req);
    const result = await this.userService.setCreatorVerified(id, false, actorId, req.ip);
    await this.auditLogService.log({
      actorId,
      action: 'creator.unverified',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Get(':id/suspensions')
  async getUserSuspensions(@Param('id') id: string): Promise<unknown> {
    return this.userService.getUserSuspensions(id);
  }

  @Delete(':id')
  @Roles('superadmin')
  @RequireDualControl({ actionType: 'account_modification', description: 'Permanent deletion of user account' })
  async deleteUser(@Param('id') id: string, @Req() req: AuthRequest): Promise<unknown> {
    const actorId = resolveActorId(req);
    const result = await this.userService.deleteUser(id, actorId);
    await this.auditLogService.log({
      actorId,
      action: 'user.deleted',
      targetType: 'user',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }
}
