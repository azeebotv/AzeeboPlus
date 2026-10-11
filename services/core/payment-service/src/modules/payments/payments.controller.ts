import {
  Inject,
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { PaymentsService } from './payments.service.js';
import { InitializePaymentDto } from './dto/initialize-payment.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import { RequestRefundDto } from './dto/request-refund.dto.js';
import {
  PaymentResponse,
  InitializePaymentResponse,
  VerifyPaymentResponse,
  TransactionHistoryResponse,
} from './interfaces/payment-response.interface.js';
import { RateLimitGuard, RateLimit, IdempotencyGuard } from '@azeebo/security';
import { FeatureFlagGuard, FeatureFlag, paymentFlags } from '@azeebo/feature-flags';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(IdempotencyGuard, RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({
    summary: 'Initialize a payment',
    description:
      'Creates a new payment intent and returns a payment URL for the user to complete payment',
  })
  @ApiBody({
    type: InitializePaymentDto,
    examples: {
      walletFunding: {
        summary: 'Fund wallet with NGN 1000',
        value: {
          amount: 1000,
          currency: 'NGN',
          paymentMethod: 'card',
          description: 'Wallet funding',
          metadata: {
            walletId: 'wallet-123',
          },
        },
      },
      contentPurchase: {
        summary: 'Purchase premium content',
        value: {
          amount: 5000,
          currency: 'NGN',
          paymentMethod: 'transfer',
          description: 'Premium content purchase',
          metadata: {
            contentId: 'content-456',
            contentType: 'video',
          },
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Payment initialized successfully',
    schema: {
      example: {
        success: true,
        data: {
          paymentId: 'pay-abc123',
          paymentUrl: 'https://checkout.paystack.com/abc123',
          status: 'pending',
          expiresAt: '2026-05-15T12:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input - validation failed',
    schema: {
      example: {
        success: false,
        error: 'Validation failed',
        details: [
          { field: 'amount', message: 'Amount must be greater than 0' },
          { field: 'currency', message: 'Invalid currency code' },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
    schema: {
      example: {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      },
    },
  })
  async initializePayment(
    @Request() req: { user: { sub: string; id: string; kycVerified?: boolean } },
    @Body() initializePaymentDto: InitializePaymentDto
  ): Promise<InitializePaymentResponse> {
    return this.paymentsService.initializePayment(
      req.user.id,
      initializePaymentDto,
      req.user.kycVerified === true
    );
  }

  @Post('intent')
  @UseGuards(FeatureFlagGuard, IdempotencyGuard, RateLimitGuard)
  @FeatureFlag(paymentFlags.intentsApi)
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a payment intent (deferred authorization)',
    description:
      'Creates a payment intent without calling the payment provider. Confirm the intent to obtain the checkout URL.',
  })
  @ApiCreatedResponse({ description: 'Payment intent created' })
  @ApiBadRequestResponse({ description: 'Invalid input - validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - invalid or missing JWT token' })
  async createIntent(
    @Request() req: { user: { sub: string; id: string } },
    @Body() initializePaymentDto: InitializePaymentDto
  ): Promise<PaymentResponse> {
    return this.paymentsService.createIntent(req.user.id, initializePaymentDto);
  }

  @Post('intent/:id/confirm')
  @UseGuards(FeatureFlagGuard, IdempotencyGuard, RateLimitGuard)
  @FeatureFlag(paymentFlags.intentsApi)
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm a payment intent',
    description:
      'Calls the active payment provider to obtain the checkout URL for a created intent.',
  })
  @ApiOkResponse({ description: 'Payment intent confirmed' })
  @ApiBadRequestResponse({ description: 'Invalid intent or provider failure' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - invalid or missing JWT token' })
  async confirmIntent(
    @Request() req: { user: { sub: string; id: string } },
    @Param('id') id: string
  ): Promise<PaymentResponse> {
    return this.paymentsService.confirmIntent(req.user.id, id);
  }

  @Post('verify')
  @UseGuards(RateLimitGuard)
  @RateLimit(20, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a payment',
    description: 'Verifies the status of a payment transaction with the payment provider',
  })
  @ApiBody({
    type: VerifyPaymentDto,
    examples: {
      verifyPaystack: {
        summary: 'Verify Paystack transaction',
        value: {
          transactionId: 'trx_abc123def456',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Payment verified successfully',
    schema: {
      example: {
        success: true,
        data: {
          paymentId: 'pay-abc123',
          transactionId: 'trx_abc123def456',
          status: 'completed',
          amount: 1000,
          currency: 'NGN',
          paidAt: '2026-05-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid payment or transaction not found',
    schema: {
      example: {
        success: false,
        error: 'Payment not found',
        message: 'The specified transaction ID was not found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
    schema: {
      example: {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      },
    },
  })
  async verifyPayment(
    @Request() req: { user: { sub: string; id: string } },
    @Body() verifyPaymentDto: VerifyPaymentDto
  ): Promise<VerifyPaymentResponse> {
    return this.paymentsService.verifyPayment(req.user.id, verifyPaymentDto.transactionId);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get payment history',
    description: 'Retrieves the payment transaction history for the authenticated user',
  })
  @ApiOkResponse({
    description: 'Payment history retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          transactions: [
            {
              id: 'pay-abc123',
              amount: 1000,
              currency: 'NGN',
              status: 'completed',
              description: 'Wallet funding',
              createdAt: '2026-05-15T10:30:00.000Z',
            },
            {
              id: 'pay-def456',
              amount: 5000,
              currency: 'NGN',
              status: 'completed',
              description: 'Premium content purchase',
              createdAt: '2026-05-14T15:45:00.000Z',
            },
          ],
          totalCount: 2,
          totalAmount: 6000,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
    schema: {
      example: {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      },
    },
  })
  async getPaymentHistory(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<TransactionHistoryResponse> {
    return this.paymentsService.getPaymentHistory(req.user.id);
  }

  // Wildcard GET route MUST come after all static GET routes
  @Get(':id')
  @ApiOperation({
    summary: 'Get payment details',
    description: 'Retrieves details of a specific payment transaction',
  })
  @ApiOkResponse({
    description: 'Payment details retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'pay-abc123',
          amount: 1000,
          currency: 'NGN',
          status: 'completed',
          description: 'Wallet funding',
          createdAt: '2026-05-15T10:30:00.000Z',
          updatedAt: '2026-05-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
    schema: {
      example: {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      },
    },
  })
  async getPayment(
    @Request() req: { user: { sub: string; id: string } },
    @Param('id') id: string
  ): Promise<PaymentResponse> {
    return this.paymentsService.getPayment(req.user.id, id);
  }

  @Post('refund-request')
  @UseGuards(FeatureFlagGuard, IdempotencyGuard, RateLimitGuard)
  @FeatureFlag(paymentFlags.selfServiceRefund)
  @RateLimit(5, 3600000)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a refund' })
  @ApiResponse({ status: 201, description: 'Refund requested' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async requestRefund(
    @Request() req: { user: { sub: string; id: string } },
    @Body() requestRefundDto: RequestRefundDto
  ): Promise<PaymentResponse> {
    return this.paymentsService.requestRefund(
      req.user.id,
      requestRefundDto.transactionId,
      requestRefundDto.reason
    );
  }
}
