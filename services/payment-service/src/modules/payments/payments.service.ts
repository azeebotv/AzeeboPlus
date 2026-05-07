import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaystackProvider } from './providers/paystack.provider';
import {
  PaymentResponse,
  InitializePaymentResponse,
  VerifyPaymentResponse,
  TransactionHistoryResponse,
} from './interfaces/payment-response.interface';

interface ProviderResponse {
  reference: string;
  authorizationUrl: string;
}

interface WebhookData {
  reference: string;
  transaction?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackProvider: PaystackProvider
  ) {}

  async initializePayment(
    userId: string,
    initializePaymentDto: InitializePaymentDto
  ): Promise<InitializePaymentResponse> {
    const { amount, currency, description, metadata } = initializePaymentDto;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        userId,
        amount,
        currency: currency || 'NGN',
        status: 'pending',
        description,
        metadata: metadata || {},
      },
    });

    try {
      const providerResponse: ProviderResponse = await this.paystackProvider.initializePayment(
        amount,
        currency || 'NGN',
        userId
      );

      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          providerReference: providerResponse.reference,
          status: 'processing',
        },
      });

      return {
        success: true,
        data: {
          paymentId: paymentIntent.id,
          provider: 'paystack',
          checkoutUrl: providerResponse.authorizationUrl,
          reference: providerResponse.reference,
          amount,
          currency: currency || 'NGN',
          status: 'pending',
          createdAt: paymentIntent.createdAt.toISOString(),
        },
      };
    } catch (error: unknown) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Payment initialization failed: ${errorMessage}`);
    }
  }

  async verifyPayment(userId: string, transactionId: string): Promise<VerifyPaymentResponse> {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id: transactionId },
    });

    if (!paymentIntent) {
      throw new NotFoundException(`Payment not found`);
    }

    if (paymentIntent.userId !== userId) {
      throw new BadRequestException('Invalid payment for user');
    }

    if (paymentIntent.status === 'completed') {
      return {
        success: true,
        data: {
          paymentId: paymentIntent.id,
          provider: 'paystack',
          reference: paymentIntent.providerReference || '',
          status: 'completed',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          paidAt: paymentIntent.completedAt?.toISOString(),
          transactionId: paymentIntent.providerReference,
        },
      };
    }

    try {
      const providerReference = paymentIntent.providerReference;
      if (!providerReference) {
        throw new BadRequestException('Payment provider reference not found');
      }

      const providerResponse = await this.paystackProvider.verifyPayment(providerReference);

      if (providerResponse.status === 'success') {
        await this.prisma.wallet.update({
          where: { userId },
          data: {
            balance: { increment: paymentIntent.amount },
          },
        });

        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          throw new BadRequestException('Wallet not found');
        }

        await this.prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            amount: paymentIntent.amount,
            status: 'completed',
            description: `Payment for ${paymentIntent.description}`,
            reference: paymentIntent.providerReference,
          },
        });

        await this.prisma.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            paymentId: paymentIntent.id,
            provider: 'paystack',
            reference: paymentIntent.providerReference || '',
            status: 'completed',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paidAt: new Date().toISOString(),
            transactionId: paymentIntent.providerReference,
          },
        };
      }

      throw new BadRequestException('Payment verification failed');
    } catch (error: unknown) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Payment verification failed: ${errorMessage}`);
    }
  }

  async getPaymentHistory(userId: string): Promise<TransactionHistoryResponse> {
    const payments = await this.prisma.paymentIntent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const transactions = payments.map((payment) => ({
      id: payment.id,
      type: 'payment' as const,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status as 'pending' | 'completed' | 'failed',
      description: payment.description || '',
      createdAt: payment.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        transactions,
        total: transactions.length,
        page: 1,
        limit: 50,
      },
    };
  }

  async handleWebhook(body: Record<string, unknown>, signature?: string): Promise<PaymentResponse> {
    if (!signature) {
      throw new BadRequestException('Webhook signature missing');
    }

    const isValid = this.paystackProvider.verifyWebhookSignature(body, signature);

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = body.event as string;
    const data = body.data as WebhookData;

    switch (event) {
      case 'charge.success':
        await this.handlePaymentSuccess(data);
        break;
      case 'charge.failed':
        await this.handlePaymentFailed(data);
        break;
      case 'refund.success':
        await this.handleRefundSuccess(data);
        break;
      default:
        this.logger.warn(`Received unhandled webhook event: ${event}`);
        return {
          success: true,
          data: { message: `Event ${event} acknowledged but not processed` },
        };
    }

    return { success: true, data: {} };
  }

  async requestRefund(
    userId: string,
    transactionId: string,
    reason: string
  ): Promise<PaymentResponse> {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id: transactionId },
    });

    if (!paymentIntent) {
      throw new NotFoundException(`Payment not found`);
    }

    if (paymentIntent.userId !== userId) {
      throw new BadRequestException('Invalid payment for user');
    }

    if (paymentIntent.status !== 'completed') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const refund = await this.prisma.refund.create({
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        reason,
        status: 'pending',
      },
    });

    try {
      const providerResponse = await this.paystackProvider.processRefund(
        paymentIntent.providerReference!,
        reason
      );

      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'completed',
          providerReference: providerResponse.reference,
        },
      });

      await this.prisma.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: paymentIntent.amount },
        },
      });

      return {
        success: true,
        data: {
          refundId: refund.id,
          amount: paymentIntent.amount,
          status: 'completed',
          message: 'Refund processed successfully',
        },
      };
    } catch (error: unknown) {
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'failed',
        },
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Refund failed: ${errorMessage}`);
    }
  }

  private async handlePaymentSuccess(data: WebhookData): Promise<void> {
    const { reference } = data;

    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: reference },
    });

    if (paymentIntent && paymentIntent.status !== 'completed') {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      await this.prisma.wallet.update({
        where: { userId: paymentIntent.userId },
        data: {
          balance: { increment: paymentIntent.amount },
        },
      });

      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: paymentIntent.userId },
      });
      if (wallet) {
        await this.prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            amount: paymentIntent.amount,
            status: 'completed',
            description: `Payment for ${paymentIntent.description}`,
            reference: paymentIntent.providerReference,
          },
        });
      }
    }
  }

  private async handlePaymentFailed(data: WebhookData): Promise<void> {
    const { reference } = data;

    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: reference },
    });

    if (paymentIntent) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });
    }
  }

  private async handleRefundSuccess(data: WebhookData): Promise<void> {
    const { reference, transaction } = data;

    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: transaction },
    });

    if (paymentIntent) {
      const refund = await this.prisma.refund.findFirst({
        where: { paymentIntentId: paymentIntent.id },
      });

      if (refund) {
        await this.prisma.refund.update({
          where: { id: refund.id },
          data: {
            status: 'completed',
            providerReference: reference,
          },
        });
      }
    }
  }
}
