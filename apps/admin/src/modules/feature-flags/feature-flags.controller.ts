import { Controller, Get, Put, Delete, Param, Body, Req, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureFlagsService } from './feature-flags.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

interface AdminRequest extends Request {
  user?: { id?: string; sub?: string };
}

@ApiTags('Admin - Global Feature Flags')
@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class FeatureFlagsController {
  constructor(
    @Inject(FeatureFlagsService) private readonly featureFlagsService: FeatureFlagsService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all global feature flags (stored + defaults)' })
  @ApiResponse({ status: 200, description: 'Global feature flags' })
  async getAll() {
    return this.featureFlagsService.getAll();
  }

  @Put(':key')
  @ApiOperation({ summary: 'Create or update a global feature flag' })
  @ApiResponse({ status: 200, description: 'Flag updated' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Req() req: AdminRequest
  ) {
    return this.featureFlagsService.update(key, dto, req.user?.id ?? req.user?.sub);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a global feature flag (falls back to its default)' })
  @ApiResponse({ status: 200, description: 'Flag deleted' })
  async remove(@Param('key') key: string, @Req() req: AdminRequest) {
    return this.featureFlagsService.remove(key, req.user?.id ?? req.user?.sub);
  }
}
