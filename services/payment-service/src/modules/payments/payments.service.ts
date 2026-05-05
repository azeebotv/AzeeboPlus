import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaystackProvider } from './providers/paystack.provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackProvider: PaystackProvider
  ) {}

  async initializePayment(userId: string, initializePaymentDto: InitializePaymentDto) {
    const { amount, currency, description, metadata } = initializePaymentDto;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Create payment intent
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

    // Initialize with Paystack provider
    try {
      const providerResponse = await this.paystackProvider.initializePayment(amount, currency || 'NGN', userId);

      // Update payment intent with provider reference
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
          providerReference: providerResponse.reference,
          authorizationUrl: providerResponse.authorizationUrl,
          amount,
          currency: currency || 'NGN',
          status: 'processing',
          message: 'Payment initialized successfully',
        },
      };
    } catch (error: any) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });

      throw new BadRequestException(`Payment initialization failed: ${error.message}`);
    }
  }

  async verifyPayment(userId: string, transactionId: string) {
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
          status: 'completed',
          message: 'Payment already verified',
        },
      };
    }

    // Verify with Paystack provider
    try {
      const providerReference = paymentIntent.providerReference;
      if (!providerReference) {
        throw new BadRequestException('Payment provider reference not found');
      }
      
      const providerResponse = await this.paystackProvider.verifyPayment(providerReference);

      if (providerResponse.status === 'success' || providerResponse.status === 'success') {
        // Update wallet balance
        await this.prisma.wallet.update({
          where: { userId },
          data: {
            balance: { increment: paymentIntent.amount },
          },
        });

        // Record transaction
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

        // Update payment intent
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
            status: 'completed',
            message: 'Payment verified successfully',
          },
        };
      }

      throw new BadRequestException('Payment verification failed');
    } catch (error: any) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });

      throw new BadRequestException(`Payment verification failed: ${error.message}`);
    }
  }

  async getPaymentHistory(userId: string) {
    const payments = await this.prisma.paymentIntent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: payments,
    };
  }

  async handleWebhook(body: any, signature: string) {
    // Verify webhook signature
    const isValid = this.paystackProvider.verifyWebhookSignature(body, signature);

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Process webhook based on event type
    const { event, data } = body;

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
        return { success: true, message: `Event ${event} acknowledged but not processed` };
    }

    return { success: true };
  }

  async requestRefund(userId: string, transactionId: string, reason: string) {
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

    // Create refund request
    const refund = await this.prisma.refund.create({
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        reason,
        status: 'pending',
      },
    });

    // Process refund with Paystack provider
    try {
      const providerResponse = await this.paystackProvider.processRefund(paymentIntent.providerReference!, reason);

      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'completed',
          providerReference: providerResponse.reference,
        },
      });

      // Update wallet balance
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
    } catch (error: any) {
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'failed',
        },
      });

      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  private async handlePaymentSuccess(data: any) {
    const { reference } = data;

    // Find payment intent by provider reference
    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: reference },
    });

    if (paymentIntent && paymentIntent.status !== 'completed') {
      // Update payment intent
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Update wallet balance
      await this.prisma.wallet.update({
        where: { userId: paymentIntent.userId },
        data: {
          balance: { increment: paymentIntent.amount },
        },
      });

      // Record transaction
      const wallet = await this.prisma.wallet.findUnique({ where: { userId: paymentIntent.userId } });
      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet!.id,
          type: 'credit',
          amount: paymentIntent.amount,
          status: 'completed',
          description: `Payment for ${paymentIntent.description}`,
          reference: paymentIntent.providerReference,
        },
      });
    }
  }

  private async handlePaymentFailed(data: any) {
    const { reference } = data;

    // Find payment intent by provider reference
    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: reference },
    });

    if (paymentIntent) {
      // Update payment intent
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });
    }
  }

  private async handleRefundSuccess(data: any) {
    const { reference, transaction } = data;

    // Find payment intent by provider reference
    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: transaction },
    });

    if (paymentIntent) {
      // Find or create refund record
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
