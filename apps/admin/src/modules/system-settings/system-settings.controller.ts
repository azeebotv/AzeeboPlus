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
import { SystemSettingsService } from './system-settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SystemSettingsController {
  private readonly logger = new Logger(SystemSettingsController.name);

  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  async getAllSettings() {
    return this.systemSettingsService.getAllSettings();
  }

  @Get('public')
  async getPublicSettings() {
    return this.systemSettingsService.getPublicSettings();
  }

  @Get('map')
  async getSettingsMap() {
    return this.systemSettingsService.getSettingsMap();
  }

  @Get('category/:category')
  async getSettingsByCategory(@Param('category') category: string) {
    return this.systemSettingsService.getSettingsByCategory(category);
  }

  @Get('value/:key')
  async getSettingValue(@Param('key') key: string) {
    const value = await this.systemSettingsService.getSettingValue(key);
    return { key, value };
  }

  @Get(':key')
  async getSettingByKey(@Param('key') key: string) {
    return this.systemSettingsService.getSettingByKey(key);
  }

  @Post()
  async createSetting(@Body() data: CreateSettingDto) {
    this.logger.log(`Creating setting: ${data.key}`);
    return this.systemSettingsService.createSetting(data);
  }

  @Post('bulk')
  async bulkCreateSettings(@Body() settings: CreateSettingDto[]) {
    this.logger.log(`Bulk creating ${settings.length} settings`);
    return this.systemSettingsService.bulkCreateSettings(settings);
  }

  @Put('bulk')
  async bulkUpdateSettings(@Body() settings: { key: string; value: any }[]) {
    this.logger.log(`Bulk updating ${settings.length} settings`);
    return this.systemSettingsService.bulkUpdateSettings(settings);
  }

  @Put(':key')
  async updateSetting(@Param('key') key: string, @Body() data: UpdateSettingDto) {
    this.logger.log(`Updating setting: ${key}`);
    return this.systemSettingsService.updateSetting(key, data);
  }

  @Delete(':key')
  async deleteSetting(@Param('key') key: string) {
    this.logger.log(`Deleting setting: ${key}`);
    return this.systemSettingsService.deleteSetting(key);
  }
}
