import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '@azeebo/security';
import { AuditLogService } from '../audit/audit.service';

@ApiTags('Admin Menus')
@Controller('admin/menus')
export class MenusController {
  constructor(
    @Inject(MenusService) private readonly menusService: MenusService,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService
  ) {}

  private getActorId(req: { user?: { sub: string; id?: string } }): string | undefined {
    return req.user?.id || req.user?.sub;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PUBLIC
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('public/:location')
  @Public()
  @ApiOperation({ summary: 'Get active public navigation menu by location' })
  async getPublicMenu(@Param('location') location: string) {
    const data = await this.menusService.getPublicMenu(location);
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADMIN READ-ONLY
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all navigation menus (Admin/Superadmin)' })
  async listMenus() {
    const data = await this.menusService.listMenus();
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get menu details by ID (Admin/Superadmin)' })
  async getMenuById(@Param('id') id: string) {
    const data = await this.menusService.getMenuById(id);
    return { success: true, data };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SUPERADMIN MUTATIONS (Create menu & list what should be visible)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create navigation menu (Superadmin only)' })
  async createMenu(
    @Body() dto: CreateMenuDto,
    @Req() req: { user?: { sub: string; id?: string }; ip?: string }
  ) {
    const actorId = this.getActorId(req);
    const data = await this.menusService.createMenu(dto, actorId);
    await this.auditLogService.log({
      actorId,
      action: 'menu.created',
      targetType: 'menu',
      targetId: data.id,
      details: { name: data.name, location: data.location, itemCount: data.items.length },
      ipAddress: req.ip,
    });
    return { success: true, data, message: 'Menu created successfully' };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update menu items & visibility list (Superadmin only)' })
  async updateMenu(
    @Param('id') id: string,
    @Body() dto: UpdateMenuDto,
    @Req() req: { user?: { sub: string; id?: string }; ip?: string }
  ) {
    const actorId = this.getActorId(req);
    const data = await this.menusService.updateMenu(id, dto, actorId);
    await this.auditLogService.log({
      actorId,
      action: 'menu.updated',
      targetType: 'menu',
      targetId: id,
      details: {
        name: data.name,
        visibleCount: data.items.filter((i) => i.isVisible).length,
        totalItems: data.items.length,
      },
      ipAddress: req.ip,
    });
    return { success: true, data, message: 'Menu updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete custom menu (Superadmin only)' })
  async deleteMenu(
    @Param('id') id: string,
    @Req() req: { user?: { sub: string; id?: string }; ip?: string }
  ) {
    const actorId = this.getActorId(req);
    const result = await this.menusService.deleteMenu(id, actorId);
    await this.auditLogService.log({
      actorId,
      action: 'menu.deleted',
      targetType: 'menu',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }
}
