import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

interface PaystackWebhookBody {
  createdAt?: string;
  timestamp?: number;
  event?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PaystackWebhookGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!signature) {
      throw new UnauthorizedException('Missing Paystack webhook signature');
    }

    if (!secret) {
      throw new UnauthorizedException('Paystack webhook secret not configured');
    }

    const rawBody = request.rawBody || JSON.stringify(request.body);

    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    if (!this.constantTimeCompare(hash, signature)) {
      throw new UnauthorizedException('Invalid Paystack webhook signature');
    }

    await this.validateEventTimestamp(request.body);

    return true;
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  private async validateEventTimestamp(body: PaystackWebhookBody): Promise<void> {
    if (body.createdAt || body.timestamp) {
      const eventTime = body.createdAt
        ? new Date(body.createdAt)
        : new Date((body.timestamp || 0) * 1000);
      const now = new Date();
      const maxAgeMs = 5 * 60 * 1000;

      if (Math.abs(now.getTime() - eventTime.getTime()) > maxAgeMs) {
        throw new UnauthorizedException('Webhook event timestamp is too old');
      }
    }
  }
}
