import {
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
} from '@nestjs/common';
import { UniverseManagementService } from './universe-management.service';
import { CreateUniverseDto } from './dto/create-universe.dto';
import { UpdateUniverseDto } from './dto/update-universe.dto';
import { UniverseFeatureFlagDto } from './dto/universe-feature-flag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/universes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UniverseManagementController {
  private readonly logger = new Logger(UniverseManagementController.name);

  constructor(private readonly universeManagementService: UniverseManagementService) {}

  @Get()
  async getAllUniverses() {
    return this.universeManagementService.getAllUniverses();
  }

  @Get('enabled')
  async getEnabledUniverses() {
    return this.universeManagementService.getEnabledUniverses();
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
    const isEnabled = await this.universeManagementService.checkFeatureFlag(universeName, featureKey);
    return { universeName, featureKey, isEnabled };
  }

  @Get(':id')
  async getUniverseById(@Param('id') id: string) {
    return this.universeManagementService.getUniverseById(id);
  }

  @Post()
  async createUniverse(@Body() data: CreateUniverseDto) {
    this.logger.log(`Creating universe: ${data.name}`);
    return this.universeManagementService.createUniverse(data);
  }

  @Put(':id')
  async updateUniverse(@Param('id') id: string, @Body() data: UpdateUniverseDto) {
    this.logger.log(`Updating universe: ${id}`);
    return this.universeManagementService.updateUniverse(id, data);
  }

  @Delete(':id')
  async deleteUniverse(@Param('id') id: string) {
    this.logger.log(`Deleting universe: ${id}`);
    return this.universeManagementService.deleteUniverse(id);
  }

  @Put(':id/toggle')
  async toggleUniverse(@Param('id') id: string, @Body('isEnabled') isEnabled: boolean) {
    this.logger.log(`Toggling universe ${id} to ${isEnabled ? 'enabled' : 'disabled'}`);
    return this.universeManagementService.toggleUniverse(id, isEnabled);
  }

  @Put(':id/feature-flags')
  async updateFeatureFlag(@Param('id') id: string, @Body() data: UniverseFeatureFlagDto) {
    this.logger.log(`Updating feature flag ${data.featureKey} for universe ${id}`);
    return this.universeManagementService.updateFeatureFlag(id, data);
  }

  @Delete(':id/feature-flags/:featureKey')
  async deleteFeatureFlag(@Param('id') id: string, @Param('featureKey') featureKey: string) {
    this.logger.log(`Deleting feature flag ${featureKey} for universe ${id}`);
    return this.universeManagementService.deleteFeatureFlag(id, featureKey);
  }
}
