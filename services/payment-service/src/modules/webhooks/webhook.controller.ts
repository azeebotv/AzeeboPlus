import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { WebhookService, WebhookPayload } from './webhook.service';
import { PaystackWebhookGuard } from './guards/paystack-webhook.guard';
import { FlutterwaveWebhookGuard } from './guards/flutterwave-webhook.guard';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@Controller('webhooks')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post('paystack')
  @UseGuards(PaystackWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(@Body() payload: WebhookPayload) {
    await this.webhookService.handlePaystackWebhook(payload);
    return ApiResponseWrapper.success({ received: true });
  }

  @Post('flutterwave')
  @UseGuards(FlutterwaveWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handleFlutterwaveWebhook(@Body() payload: WebhookPayload) {
    await this.webhookService.handleFlutterwaveWebhook(payload);
    return ApiResponseWrapper.success({ received: true });
  }
}
