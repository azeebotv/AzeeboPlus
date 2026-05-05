import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RequestRefundDto } from './dto/request-refund.dto';
import { PaymentResponse } from './interfaces/payment-response.interface';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Initialize a payment' })
  @ApiResponse({ status: 201, description: 'Payment initialized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initializePayment(
    @Request() req: { user: { sub: string } },
    @Body() initializePaymentDto: InitializePaymentDto,
  ): Promise<PaymentResponse> {
    return this.paymentsService.initializePayment(req.user.sub, initializePaymentDto);
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a payment' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  @ApiResponse({ status: 400, description: 'Invalid payment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyPayment(
    @Request() req: { user: { sub: string } },
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ): Promise<PaymentResponse> {
    return this.paymentsService.verifyPayment(req.user.sub, verifyPaymentDto.transactionId);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Payment history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentHistory(@Request() req: { user: { sub: string } }) {
    return this.paymentsService.getPaymentHistory(req.user.sub);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(@Body() body: any, @Headers('x-paystack-signature') signature: string) {
    return this.paymentsService.handleWebhook(body, signature);
  }

  @Post('refund-request')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a refund' })
  @ApiResponse({ status: 201, description: 'Refund requested' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async requestRefund(
    @Request() req: { user: { sub: string } },
    @Body() requestRefundDto: RequestRefundDto,
  ): Promise<PaymentResponse> {
    return this.paymentsService.requestRefund(req.user.sub, requestRefundDto.transactionId, requestRefundDto.reason);
  }
}
