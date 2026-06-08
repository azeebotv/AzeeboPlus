import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

interface FlutterwaveWebhookBody {
  event?: {
    createdAt?: string;
    timestamp?: number;
  };
  createdAt?: string;
  timestamp?: number;
}

@Injectable()
export class FlutterwaveWebhookGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['verif-hash'];
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (!signature) {
      throw new UnauthorizedException('Missing Flutterwave webhook signature');
    }

    if (!secret) {
      throw new UnauthorizedException('Flutterwave webhook secret not configured');
    }

    const rawBody = request.rawBody || JSON.stringify(request.body);

    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    if (!this.constantTimeCompare(hash, signature)) {
      throw new UnauthorizedException('Invalid Flutterwave webhook signature');
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

  private async validateEventTimestamp(body: FlutterwaveWebhookBody): Promise<void> {
    if (body.createdAt || body.timestamp || body.event?.createdAt) {
      const eventData = body.event || body;
      const eventTime = eventData.createdAt
        ? new Date(eventData.createdAt)
        : new Date((eventData.timestamp || Date.now()) * 1000);
      const now = new Date();
      const maxAgeMs = 5 * 60 * 1000;

      if (Math.abs(now.getTime() - eventTime.getTime()) > maxAgeMs) {
        throw new UnauthorizedException('Webhook event timestamp is too old');
      }
    }
  }
}
