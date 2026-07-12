import { Inject, Controller, Get, Put, Delete, Param, Query, Body, UseGuards, Req  } from '@nestjs/common';
import { Request } from 'express';
import { UserManagementService } from './user-management.service';
import { AuditLogService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
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

  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() body: { role: string }
  ): Promise<unknown> {
    const result = await this.userService.updateUserRole(id, body.role);
    await this.auditLogService.log({
      actorId: req.user.id,
      action: 'user.role.updated',
      targetType: 'user',
      targetId: id,
      details: { role: body.role },
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
    const actorId = req.user.id;
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
    const actorId = req.user.id;
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

  @Get(':id/suspensions')
  async getUserSuspensions(@Param('id') id: string): Promise<unknown> {
    return this.userService.getUserSuspensions(id);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req: AuthRequest): Promise<unknown> {
    const actorId = req.user.id;
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
