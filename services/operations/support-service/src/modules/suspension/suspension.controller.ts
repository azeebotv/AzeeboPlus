import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SuspensionService } from './suspension.service';
import { CreateSuspensionDto, SuspensionQueryDto } from './dto/suspension.dto';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { ServiceAuthGuard } from '@azeebo/security';
import { AdminGuard } from '@azeebo/security';

interface AuthenticatedRequest {
  user: {
    id: string;
    role?: string;
  };
}

@ApiTags('User Suspensions')
@Controller('support/suspensions')
@UseGuards(ServiceAuthGuard)
@ApiBearerAuth()
export class SuspensionController {
  constructor(@Inject(SuspensionService) private suspensionService: SuspensionService) {}

  @Post()
  @ApiOperation({ summary: 'Suspend user (admin)' })
  @UseGuards(AdminGuard)
  async createSuspension(@Request() req: AuthenticatedRequest, @Body() dto: CreateSuspensionDto) {
    const suspension = await this.suspensionService.createSuspension({
      ticketId: dto.ticketId,
      userId: dto.userId,
      reason: dto.reason,
      suspendedBy: req.user.id,
      durationDays: dto.durationDays,
    });
    return ApiResponseWrapper.success({ suspension });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active suspensions (admin)' })
  @UseGuards(AdminGuard)
  async getActiveSuspensions(@Query() query: SuspensionQueryDto) {
    const result = await this.suspensionService.getActiveSuspensions(query);
    return ApiResponseWrapper.paginated(
      result.suspensions,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my suspensions' })
  async getMySuspensions(@Request() req: AuthenticatedRequest) {
    const suspensions = await this.suspensionService.getUserSuspensions(req.user.id);
    return ApiResponseWrapper.success({ suspensions });
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user suspensions (admin)' })
  @UseGuards(AdminGuard)
  async getUserSuspensions(@Param('userId') userId: string) {
    const suspensions = await this.suspensionService.getUserSuspensions(userId);
    return ApiResponseWrapper.success({ suspensions });
  }

  @Get('user/:userId/active')
  @ApiOperation({ summary: 'Check if user is suspended (admin)' })
  @UseGuards(AdminGuard)
  async getActiveSuspension(@Param('userId') userId: string) {
    const suspension = await this.suspensionService.getActiveSuspension(userId);
    return ApiResponseWrapper.success({ suspension });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get suspension by ID (admin)' })
  @UseGuards(AdminGuard)
  async getSuspension(@Param('id') id: string) {
    const suspension = await this.suspensionService.getSuspensionById(id);
    return ApiResponseWrapper.success({ suspension });
  }

  @Post(':id/reinstate')
  @ApiOperation({ summary: 'Reinstate user (admin)' })
  @UseGuards(AdminGuard)
  async reinstateUser(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const suspension = await this.suspensionService.reinstateUser(id, req.user.id);
    return ApiResponseWrapper.success({ suspension });
  }

  @Post(':id/lift')
  @ApiOperation({ summary: 'Lift suspension early (admin)' })
  @UseGuards(AdminGuard)
  async liftSuspension(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const suspension = await this.suspensionService.liftSuspension(id, req.user.id);
    return ApiResponseWrapper.success({ suspension });
  }
}
