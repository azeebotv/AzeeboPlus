import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { WebhookService, WebhookPayload } from './webhook.service';
import { PaystackWebhookGuard } from './guards/paystack-webhook.guard';
import { FlutterwaveWebhookGuard } from './guards/flutterwave-webhook.guard';

@Controller('webhooks')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post('paystack')
  @UseGuards(PaystackWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(@Body() payload: WebhookPayload): Promise<{ success: boolean }> {
    await this.webhookService.handlePaystackWebhook(payload);
    return { success: true };
  }

  @Post('flutterwave')
  @UseGuards(FlutterwaveWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handleFlutterwaveWebhook(@Body() payload: WebhookPayload): Promise<{ success: boolean }> {
    await this.webhookService.handleFlutterwaveWebhook(payload);
    return { success: true };
  }
}
