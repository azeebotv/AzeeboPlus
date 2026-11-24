import {
  Inject,
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
import { ChargebackService } from './chargeback.service';
import {
  CreateChargebackDto,
  SubmitEvidenceDto,
  ResolveChargebackDto,
  ChargebackQueryDto,
} from './dto/chargeback.dto';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { Prisma } from '../../prisma/client/index.js';
import { ServiceAuthGuard } from '@azeebo/security';
import { AdminGuard } from '@azeebo/security';

interface AuthenticatedRequest {
  user: {
    id: string;
    role?: string;
  };
}

@ApiTags('Chargebacks')
@Controller('support/chargebacks')
@UseGuards(ServiceAuthGuard)
@ApiBearerAuth()
export class ChargebackController {
  constructor(@Inject(ChargebackService) private chargebackService: ChargebackService) {}

  @Post()
  @ApiOperation({ summary: 'Create a chargeback case' })
  async createChargeback(@Request() req: AuthenticatedRequest, @Body() dto: CreateChargebackDto) {
    const chargeback = await this.chargebackService.createChargeback({
      ticketId: dto.ticketId,
      paymentId: dto.paymentId,
      userId: req.user.id,
      amount: new Prisma.Decimal(dto.amount),
      reason: dto.reason,
    });
    return ApiResponseWrapper.success({ chargeback });
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending chargebacks (admin)' })
  @UseGuards(AdminGuard)
  async getPendingChargebacks(@Query() query: ChargebackQueryDto) {
    const result = await this.chargebackService.getPendingChargebacks(query);
    return ApiResponseWrapper.paginated(
      result.chargebacks,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my chargebacks' })
  async getMyChargebacks(@Request() req: AuthenticatedRequest, @Query() query: ChargebackQueryDto) {
    const result = await this.chargebackService.getUserChargebacks(req.user.id, query);
    return ApiResponseWrapper.paginated(
      result.chargebacks,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chargeback by ID (admin)' })
  @UseGuards(AdminGuard)
  async getChargeback(@Param('id') id: string) {
    const chargeback = await this.chargebackService.getChargebackById(id);
    return ApiResponseWrapper.success({ chargeback });
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Submit chargeback evidence' })
  async submitEvidence(@Param('id') id: string, @Body() dto: SubmitEvidenceDto) {
    const chargeback = await this.chargebackService.submitEvidence(id, dto.evidence);
    return ApiResponseWrapper.success({ chargeback });
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve chargeback (admin)' })
  @UseGuards(AdminGuard)
  async resolveChargeback(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: ResolveChargebackDto
  ) {
    const chargeback = await this.chargebackService.resolveChargeback(
      id,
      dto.resolution,
      req.user.id,
      dto.evidence
    );
    return ApiResponseWrapper.success({ chargeback });
  }
}
