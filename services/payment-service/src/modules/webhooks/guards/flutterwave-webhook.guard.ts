import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class FlutterwaveWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['verif-hash'];
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

    if (!signature) {
      throw new UnauthorizedException('Missing Flutterwave webhook signature');
    }

    if (!secret) {
      throw new UnauthorizedException('Flutterwave webhook secret not configured');
    }

    const hash = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(request.body))
      .digest('hex');

    if (hash !== signature) {
      throw new UnauthorizedException('Invalid Flutterwave webhook signature');
    }

    return true;
  }
}