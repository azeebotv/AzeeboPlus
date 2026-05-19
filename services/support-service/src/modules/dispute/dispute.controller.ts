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
import { DisputeService } from './dispute.service';
import { CreateDisputeDto, ResolveDisputeDto, DisputeQueryDto } from './dto/dispute.dto';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { Prisma } from '../../prisma/client';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

interface AuthenticatedRequest {
  user: {
    id: string;
    role?: string;
  };
}

@ApiTags('Payout Disputes')
@Controller('support/disputes')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DisputeController {
  constructor(private disputeService: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create payout dispute' })
  async createDispute(@Request() req: AuthenticatedRequest, @Body() dto: CreateDisputeDto) {
    const dispute = await this.disputeService.createDispute({
      ticketId: dto.ticketId,
      creatorId: req.user.id,
      payoutId: dto.payoutId,
      amount: new Prisma.Decimal(dto.amount),
      reason: dto.reason,
      evidence: dto.evidence as Prisma.InputJsonValue,
    });
    return ApiResponseWrapper.success({ dispute });
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending disputes (admin)' })
  @UseGuards(AdminGuard)
  async getPendingDisputes(@Query() query: DisputeQueryDto) {
    const result = await this.disputeService.getPendingDisputes(query);
    return ApiResponseWrapper.paginated(
      result.disputes,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my disputes (creator)' })
  async getMyDisputes(@Request() req: AuthenticatedRequest, @Query() query: DisputeQueryDto) {
    const result = await this.disputeService.getCreatorDisputes(req.user.id, query);
    return ApiResponseWrapper.paginated(
      result.disputes,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID (admin)' })
  @UseGuards(AdminGuard)
  async getDispute(@Param('id') id: string) {
    const dispute = await this.disputeService.getDisputeById(id);
    return ApiResponseWrapper.success({ dispute });
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve dispute (admin)' })
  @UseGuards(AdminGuard)
  async resolveDispute(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ResolveDisputeDto
  ) {
    const dispute = await this.disputeService.resolveDispute(
      id,
      dto.resolution,
      req.user.id,
      dto.notes,
      dto.compensation ? new Prisma.Decimal(dto.compensation) : undefined
    );
    return ApiResponseWrapper.success({ dispute });
  }
}
