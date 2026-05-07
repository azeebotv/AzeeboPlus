import { Controller, Get, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { UserManagementService } from './user-management.service';

@Controller('admin/users')
export class UserManagementController {
  constructor(private readonly userService: UserManagementService) {}

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
  async updateUserRole(@Param('id') id: string, @Body() body: { role: string }): Promise<unknown> {
    return this.userService.updateUserRole(id, body.role);
  }

  @Put(':id/suspend')
  async suspendUser(
    @Param('id') id: string,
    @Body() body: { reason: string; suspendedBy: string; durationDays?: number }
  ): Promise<unknown> {
    return this.userService.suspendUser(id, body.reason, body.suspendedBy, body.durationDays);
  }

  @Put(':id/suspension/revoke')
  async revokeSuspension(
    @Param('id') id: string,
    @Body() body: { revokedBy: string; reason: string }
  ): Promise<unknown> {
    return this.userService.revokeSuspension(id, body.revokedBy, body.reason);
  }

  @Get(':id/suspensions')
  async getUserSuspensions(@Param('id') id: string): Promise<unknown> {
    return this.userService.getUserSuspensions(id);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<unknown> {
    return this.userService.deleteUser(id);
  }
}
