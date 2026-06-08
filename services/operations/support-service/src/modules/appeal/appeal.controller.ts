import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppealService } from './appeal.service';
import { CreateAppealDto, DecideAppealDto, AppealQueryDto } from './dto/appeal.dto';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '@azeebo/security';

interface AuthenticatedRequest {
  user: {
    id: string;
    role?: string;
  };
}

@ApiTags('Appeals')
@Controller('support/appeals')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AppealController {
  constructor(private appealService: AppealService) {}

  @Post()
  @ApiOperation({ summary: 'Submit an appeal' })
  async createAppeal(@Request() req: AuthenticatedRequest, @Body() dto: CreateAppealDto) {
    const appeal = await this.appealService.createAppeal({
      ticketId: dto.ticketId,
      userId: req.user.id,
      appealType: dto.appealType,
      resourceId: dto.resourceId,
      resourceType: dto.resourceType,
      originalDecision: dto.originalDecision,
      reason: dto.reason,
      evidence: dto.evidence,
    });
    return ApiResponseWrapper.success({ appeal });
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending appeals (admin)' })
  @UseGuards(AdminGuard)
  async getPendingAppeals(@Query() query: AppealQueryDto) {
    const result = await this.appealService.getPendingAppeals(query);
    return ApiResponseWrapper.paginated(
      result.appeals,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my appeals' })
  async getMyAppeals(@Request() req: AuthenticatedRequest, @Query() query: AppealQueryDto) {
    const result = await this.appealService.getUserAppeals(req.user.id, query);
    return ApiResponseWrapper.paginated(
      result.appeals,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appeal by ID (admin)' })
  @UseGuards(AdminGuard)
  async getAppeal(@Param('id') id: string) {
    const appeal = await this.appealService.getAppealById(id);
    return ApiResponseWrapper.success({ appeal });
  }

  @Patch(':id/decide')
  @ApiOperation({ summary: 'Decide appeal (admin)' })
  @UseGuards(AdminGuard)
  async decideAppeal(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: DecideAppealDto
  ) {
    const appeal = await this.appealService.decideAppeal(id, dto.decision, req.user.id, dto.notes);
    return ApiResponseWrapper.success({ appeal });
  }
}
