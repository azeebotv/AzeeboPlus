import { Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  Req,
 } from '@nestjs/common';
import { Request } from 'express';
import { UniverseManagementService } from './universe-management.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateUniverseDto } from './dto/create-universe.dto';
import { UpdateUniverseDto } from './dto/update-universe.dto';
import { UniverseFeatureFlagDto } from './dto/universe-feature-flag.dto';
import { QueryUniverseDto } from './dto/query-universe.dto';
import { BulkToggleUniverseDto } from './dto/bulk-toggle-universe.dto';
import { CloneUniverseDto } from './dto/clone-universe.dto';
import { ImportUniversesBodyDto } from './dto/import-universe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AdminRequest extends Request {
  user?: { id?: string; sub?: string };
}

@Controller('admin/universes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class UniverseManagementController {
  private readonly logger = new Logger(UniverseManagementController.name);

  constructor(
    @Inject(UniverseManagementService) private readonly universeManagementService: UniverseManagementService,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService
  ) {}

  @Get()
  async getAllUniverses(@Query() query: QueryUniverseDto) {
    return this.universeManagementService.getAllUniverses(query);
  }

  @Get('stats')
  async getStats() {
    return this.universeManagementService.getStats();
  }

  @Get('enabled')
  async getEnabledUniverses() {
    return this.universeManagementService.getEnabledUniverses();
  }

  @Get('feature-flags')
  async getAllFeatureFlags() {
    return this.universeManagementService.getAllFeatureFlags();
  }

  @Get('relationships')
  async getRelationships() {
    return this.universeManagementService.getRelationships();
  }

  @Get('name/:name')
  async getUniverseByName(@Param('name') name: string) {
    return this.universeManagementService.getUniverseByName(name);
  }

  @Get('check/:universeName/:featureKey')
  async checkFeatureFlag(
    @Param('universeName') universeName: string,
    @Param('featureKey') featureKey: string
  ) {
    const isEnabled = await this.universeManagementService.checkFeatureFlag(
      universeName,
      featureKey
    );
    return { universeName, featureKey, isEnabled };
  }

  @Get('export/:id')
  async exportUniverse(@Param('id') id: string) {
    return this.universeManagementService.exportUniverse(id);
  }

  @Get(':id')
  async getUniverseById(@Param('id') id: string) {
    return this.universeManagementService.getUniverseById(id);
  }

  @Post()
  async createUniverse(@Body() data: CreateUniverseDto, @Req() req: AdminRequest) {
    this.logger.log(`Creating universe: ${data.name}`);
    const result = await this.universeManagementService.createUniverse(data);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.created',
      targetType: 'universe',
      targetId: result.id,
      details: { name: data.name },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('bulk/toggle')
  @HttpCode(HttpStatus.OK)
  async bulkToggle(@Body() data: BulkToggleUniverseDto, @Req() req: AdminRequest) {
    this.logger.log(
      `Bulk toggling ${data.ids.length} universes to ${data.isEnabled ? 'enabled' : 'disabled'}`
    );
    const result = await this.universeManagementService.bulkToggle(data);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.bulk_toggled',
      targetType: 'universe',
      targetId: data.ids.join(','),
      details: { count: data.ids.length, isEnabled: data.isEnabled },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  async importUniverses(@Body() data: ImportUniversesBodyDto, @Req() req: AdminRequest) {
    this.logger.log(`Importing ${data.universes.length} universes`);
    const result = await this.universeManagementService.importUniverses(data.universes);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.imported',
      targetType: 'universe',
      details: { count: data.universes.length },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post(':id/copy')
  @HttpCode(HttpStatus.CREATED)
  async cloneUniverse(
    @Param('id') id: string,
    @Body() data: CloneUniverseDto,
    @Req() req: AdminRequest
  ) {
    this.logger.log(`Cloning universe ${id} to ${data.name}`);
    const result = await this.universeManagementService.cloneUniverse(id, data);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.cloned',
      targetType: 'universe',
      targetId: id,
      details: { sourceId: id, targetName: data.name },
      ipAddress: req.ip,
    });
    return result;
  }

  @Put(':id')
  async updateUniverse(
    @Param('id') id: string,
    @Body() data: UpdateUniverseDto,
    @Req() req: AdminRequest
  ) {
    this.logger.log(`Updating universe: ${id}`);
    const result = await this.universeManagementService.updateUniverse(id, data);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.updated',
      targetType: 'universe',
      targetId: id,
      details: data as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });
    return result;
  }

  @Put(':id/toggle')
  async toggleUniverse(
    @Param('id') id: string,
    @Body('isEnabled') isEnabled: boolean,
    @Req() req: AdminRequest
  ) {
    this.logger.log(`Toggling universe ${id} to ${isEnabled ? 'enabled' : 'disabled'}`);
    const result = await this.universeManagementService.toggleUniverse(id, isEnabled);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.toggled',
      targetType: 'universe',
      targetId: id,
      details: { isEnabled },
      ipAddress: req.ip,
    });
    return result;
  }

  @Put(':id/feature-flags')
  async updateFeatureFlag(
    @Param('id') id: string,
    @Body() data: UniverseFeatureFlagDto,
    @Req() req: AdminRequest
  ) {
    this.logger.log(`Updating feature flag ${data.featureKey} for universe ${id}`);
    const result = await this.universeManagementService.updateFeatureFlag(id, data);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.feature_flag.updated',
      targetType: 'universe',
      targetId: id,
      details: { featureKey: data.featureKey },
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete(':id')
  async deleteUniverse(@Param('id') id: string, @Req() req: AdminRequest) {
    this.logger.log(`Deleting universe: ${id}`);
    const result = await this.universeManagementService.deleteUniverse(id);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.deleted',
      targetType: 'universe',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete(':id/feature-flags/:featureKey')
  async deleteFeatureFlag(
    @Param('id') id: string,
    @Param('featureKey') featureKey: string,
    @Req() req: AdminRequest
  ) {
    this.logger.log(`Deleting feature flag ${featureKey} for universe ${id}`);
    const result = await this.universeManagementService.deleteFeatureFlag(id, featureKey);
    await this.auditLogService.log({
      actorId: req.user?.id || req.user?.sub,
      action: 'universe.feature_flag.deleted',
      targetType: 'universe',
      targetId: id,
      details: { featureKey },
      ipAddress: req.ip,
    });
    return result;
  }
}
