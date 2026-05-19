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
import { TakedownService } from './takedown.service';
import { CreateTakedownDto, DecideTakedownDto, TakedownQueryDto } from './dto/takedown.dto';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

interface AuthenticatedRequest {
  user: {
    id: string;
    role?: string;
  };
}

@ApiTags('Content Takedowns')
@Controller('support/takedowns')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TakedownController {
  constructor(private takedownService: TakedownService) {}

  @Post()
  @ApiOperation({ summary: 'Create content takedown request' })
  async createTakedown(@Request() req: AuthenticatedRequest, @Body() dto: CreateTakedownDto) {
    const takedown = await this.takedownService.createTakedown({
      ticketId: dto.ticketId,
      contentId: dto.contentId,
      reportedBy: req.user.id,
      reason: dto.reason,
      evidence: dto.evidence,
    });
    return ApiResponseWrapper.success({ takedown });
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending takedowns (admin)' })
  @UseGuards(AdminGuard)
  async getPendingTakedowns(@Query() query: TakedownQueryDto) {
    const result = await this.takedownService.getPendingTakedowns(query);
    return ApiResponseWrapper.paginated(
      result.takedowns,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: 'Get takedowns for content (admin)' })
  @UseGuards(AdminGuard)
  async getTakedownsByContent(@Param('contentId') contentId: string) {
    const takedowns = await this.takedownService.getTakedownsByContent(contentId);
    return ApiResponseWrapper.success({ takedowns });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get takedown by ID (admin)' })
  @UseGuards(AdminGuard)
  async getTakedown(@Param('id') id: string) {
    const takedown = await this.takedownService.getTakedownById(id);
    return ApiResponseWrapper.success({ takedown });
  }

  @Patch(':id/decide')
  @ApiOperation({ summary: 'Decide takedown (admin)' })
  @UseGuards(AdminGuard)
  async decideTakedown(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: DecideTakedownDto
  ) {
    const takedown = await this.takedownService.decideTakedown(
      id,
      dto.decision,
      req.user.id,
      dto.notes
    );
    return ApiResponseWrapper.success({ takedown });
  }
}
