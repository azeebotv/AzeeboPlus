import { Inject,
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
import { RefundService } from './refund.service';
import {
  RequestRefundDto,
  ProcessRefundDto,
  RejectRefundDto,
  RefundQueryDto,
} from './dto/refund.dto';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '@azeebo/security';

interface AuthenticatedRequest {
  user: {
    id: string;
    role?: string;
  };
}

@ApiTags('Refunds')
@Controller('support/refunds')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class RefundController {
  constructor(@Inject(RefundService) private refundService: RefundService) {}

  @Post()
  @ApiOperation({ summary: 'Request a refund' })
  async requestRefund(@Request() req: AuthenticatedRequest, @Body() dto: RequestRefundDto) {
    const refund = await this.refundService.requestRefund({
      userId: req.user.id,
      paymentId: dto.paymentId,
      amount: new Prisma.Decimal(dto.amount),
      currency: dto.currency,
      reason: dto.reason,
      ticketId: dto.ticketId,
    });
    return ApiResponseWrapper.success({ refund });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my refunds' })
  async getMyRefunds(@Request() req: AuthenticatedRequest, @Query() query: RefundQueryDto) {
    const result = await this.refundService.getUserRefunds(req.user.id, query);
    return ApiResponseWrapper.paginated(
      result.refunds,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending refunds (admin)' })
  @UseGuards(AdminGuard)
  async getPendingRefunds(@Query() query: RefundQueryDto) {
    const result = await this.refundService.getPendingRefunds(query);
    return ApiResponseWrapper.paginated(
      result.refunds,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get refund by ID (admin)' })
  @UseGuards(AdminGuard)
  async getRefund(@Param('id') id: string) {
    const refund = await this.refundService.getRefundById(id);
    return ApiResponseWrapper.success({ refund });
  }

  @Patch(':id/process')
  @ApiOperation({ summary: 'Process refund (admin)' })
  @UseGuards(AdminGuard)
  async processRefund(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ProcessRefundDto
  ) {
    const refund = await this.refundService.processRefund(id, req.user.id, dto.refundReference);
    return ApiResponseWrapper.success({ refund });
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject refund (admin)' })
  @UseGuards(AdminGuard)
  async rejectRefund(@Param('id') id: string, @Body() dto: RejectRefundDto) {
    const refund = await this.refundService.rejectRefund(id, dto.reason);
    return ApiResponseWrapper.success({ refund });
  }
}
