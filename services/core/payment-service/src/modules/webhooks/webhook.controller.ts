import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Logger,
  Request,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public, RateLimitGuard, RateLimit } from '@azeebo/security';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService, WebhookPayload } from './webhook.service';
import { WebhookSecurityService } from './webhook-security.service';
import { PaystackWebhookGuard } from './guards/paystack-webhook.guard';
import { FlutterwaveWebhookGuard } from './guards/flutterwave-webhook.guard';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Webhooks')
@Public()
@UseGuards(RateLimitGuard)
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookTimeout: number;

  constructor(
    private webhookService: WebhookService,
    private webhookSecurity: WebhookSecurityService,
    private configService: ConfigService
  ) {
    this.webhookTimeout = this.configService.get<number>('WEBHOOK_TIMEOUT', 30000);
  }

  @Post('paystack')
  @RateLimit(100, 60000)
  @UseGuards(PaystackWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Paystack webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature or payload' })
  async handlePaystackWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-paystack-signature') signature: string,
    @Request() req: { rawBody?: string }
  ) {
    const reference = (payload.data as Record<string, unknown>)?.reference as string;

    if (!reference) {
      throw new BadRequestException('Missing reference in webhook payload');
    }

    const isDuplicate = await this.webhookSecurity.isDuplicate(reference);
    if (isDuplicate) {
      this.logger.log(`Duplicate Paystack webhook ignored: ${reference}`);
      return ApiResponseWrapper.success({
        received: true,
        message: 'Already processed',
      });
    }

    const rawBody = req.rawBody || JSON.stringify(payload);
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!secret) {
      throw new BadRequestException('Paystack webhook secret not configured');
    }

    const isValid = this.webhookSecurity.verifyPaystackSignature(rawBody, signature, secret);

    if (!isValid) {
      this.logger.error(`Invalid Paystack webhook signature: ${reference}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const timestamp = (payload.data as Record<string, unknown>)?.created_at
      ? Math.floor(
          new Date((payload.data as Record<string, unknown>).created_at as string).getTime() / 1000
        )
      : Math.floor(Date.now() / 1000);

    const isReplay = await this.webhookSecurity.isReplay(reference, timestamp);
    if (isReplay) {
      this.logger.warn(`Replay attack detected: ${reference}`);
      throw new BadRequestException('Webhook replay detected');
    }

    try {
      await Promise.race([
        this.webhookService.handlePaystackWebhook(payload),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Webhook processing timeout')), this.webhookTimeout)
        ),
      ]);

      await this.webhookSecurity.markAsProcessed(reference);
      await this.webhookSecurity.recordInReplayWindow(reference);

      this.logger.log(`Paystack webhook processed successfully: ${reference}`);
      return ApiResponseWrapper.success({ received: true });
    } catch (error: unknown) {
      this.logger.error(
        `Paystack webhook processing failed: ${reference}`,
        error instanceof Error ? error.message : undefined
      );
      throw error;
    }
  }

  @Post('flutterwave')
  @RateLimit(100, 60000)
  @UseGuards(FlutterwaveWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Flutterwave webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature or payload' })
  async handleFlutterwaveWebhook(
    @Body() payload: WebhookPayload,
    @Headers('verif-hash') signature: string,
    @Request() req: { rawBody?: string }
  ) {
    const reference =
      ((payload.data as Record<string, unknown>)?.txRef as string) ||
      ((payload.data as Record<string, unknown>)?.id as string);

    if (!reference) {
      throw new BadRequestException('Missing reference in webhook payload');
    }

    const isDuplicate = await this.webhookSecurity.isDuplicate(reference);
    if (isDuplicate) {
      this.logger.log(`Duplicate Flutterwave webhook ignored: ${reference}`);
      return ApiResponseWrapper.success({
        received: true,
        message: 'Already processed',
      });
    }

    const rawBody = req.rawBody || JSON.stringify(payload);
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (!secret) {
      throw new BadRequestException('Flutterwave webhook secret not configured');
    }

    const isValid = this.webhookSecurity.verifyFlutterwaveSignature(rawBody, signature, secret);

    if (!isValid) {
      this.logger.error(`Invalid Flutterwave webhook signature: ${reference}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const timestamp = (payload.data as Record<string, unknown>)?.created_at
      ? Math.floor(
          new Date((payload.data as Record<string, unknown>).created_at as string).getTime() / 1000
        )
      : Math.floor(Date.now() / 1000);

    const isReplay = await this.webhookSecurity.isReplay(reference, timestamp);
    if (isReplay) {
      this.logger.warn(`Replay attack detected: ${reference}`);
      throw new BadRequestException('Webhook replay detected');
    }

    try {
      await Promise.race([
        this.webhookService.handleFlutterwaveWebhook(payload),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Webhook processing timeout')), this.webhookTimeout)
        ),
      ]);

      await this.webhookSecurity.markAsProcessed(reference);
      await this.webhookSecurity.recordInReplayWindow(reference);

      this.logger.log(`Flutterwave webhook processed successfully: ${reference}`);
      return ApiResponseWrapper.success({ received: true });
    } catch (error: unknown) {
      this.logger.error(
        `Flutterwave webhook processing failed: ${reference}`,
        error instanceof Error ? error.message : undefined
      );
      throw error;
    }
  }
}
