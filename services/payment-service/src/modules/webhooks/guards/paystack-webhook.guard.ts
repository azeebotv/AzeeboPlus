import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PaystackWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!signature) {
      throw new UnauthorizedException('Missing Paystack webhook signature');
    }

    if (!secret) {
      throw new UnauthorizedException('Paystack webhook secret not configured');
    }

    const hash = crypto.createHmac('sha512', secret)
      .update(JSON.stringify(request.body))
      .digest('hex');

    if (hash !== signature) {
      throw new UnauthorizedException('Invalid Paystack webhook signature');
    }

    return true;
  }
}