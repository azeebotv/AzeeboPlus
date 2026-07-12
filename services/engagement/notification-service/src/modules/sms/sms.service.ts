import {Inject,  Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { CircuitBreaker, CircuitBreakerOpenError, CircuitBreakerStats } from '@azeebo/shared-types';

@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private client: twilio.Twilio | null = null;
  private smsEnabled: boolean = false;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 3,
    });
  }

  async onModuleInit(): Promise<void> {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken && fromNumber) {
      this.client = twilio(accountSid, authToken);
      this.smsEnabled = true;
      this.logger.log('Twilio initialized successfully');
    } else {
      this.logger.warn('Twilio credentials not configured. SMS notifications will be disabled.');
    }
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.smsEnabled || !this.client) {
      this.logger.warn('Twilio client not initialized. SMS not sent.');
      return false;
    }

    if (!this.isValidE164Phone(to)) {
      this.logger.warn(`Invalid phone number format (must be E.164): ${to}`);
      return false;
    }

    try {
      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');
      await this.circuitBreaker.execute(async () => {
        await this.client!.messages.create({
          body: message,
          from: fromNumber,
          to: to,
        });
      });

      this.logger.log(`SMS sent successfully to ${to}`);
      return true;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Twilio circuit breaker open: ${(error as Error).message}`);
        return false;
      }
      this.logger.error(`Error sending SMS: ${(error as Error).message}`);
      return false;
    }
  }

  async sendSmsWithTemplate(
    to: string,
    templateName: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    const message = this.getTemplateMessage(templateName, data);
    return this.sendSms(to, message);
  }

  private getTemplateMessage(templateName: string, data: Record<string, unknown>): string {
    switch (templateName) {
      case 'welcome':
        return `Welcome to Azeebo+, ${data.displayName}! Thanks for joining our platform. Start exploring amazing content today!`;

      case 'password-reset':
        return `Azeebo+ Password Reset: Use this code to reset your password: ${data.resetCode}. This code is valid for 1 hour.`;

      case 'payment-confirmation':
        return `Azeebo+ Payment Confirmation: Your payment of ${data.currency}${data.amount} has been successful. Transaction ID: ${data.transactionId}.`;

      case 'content-published':
        return `Azeebo+ Content Published: Your content "${data.contentTitle}" has been published. Check it out now!`;

      case 'content-featured':
        return `Azeebo+ Content Featured: Congratulations! Your content "${data.contentTitle}" has been featured on our platform.`;

      case 'account-verification':
        return `Azeebo+ Account Verification: Use this code to verify your account: ${data.verificationCode}.`;

      default:
        return 'This is an automated message from Azeebo+.';
    }
  }

  async sendBulkSms(numbers: string[], message: string): Promise<boolean> {
    if (!this.smsEnabled || !this.client) {
      this.logger.warn('Twilio client not initialized. Bulk SMS not sent.');
      return false;
    }

    const validNumbers = numbers.filter((n) => this.isValidE164Phone(n));
    if (validNumbers.length === 0) {
      this.logger.warn('No valid phone numbers provided for bulk SMS');
      return false;
    }

    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 1000;

    try {
      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

      for (let i = 0; i < validNumbers.length; i += BATCH_SIZE) {
        const batch = validNumbers.slice(i, i + BATCH_SIZE);
        await this.circuitBreaker.execute(async () => {
          await Promise.all(
            batch.map((number) =>
              this.client!.messages.create({
                body: message,
                from: fromNumber,
                to: number,
              })
            )
          );
        });

        if (i + BATCH_SIZE < validNumbers.length) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }

      this.logger.log(`Bulk SMS sent to ${validNumbers.length} numbers`);
      return true;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Twilio circuit breaker open: ${(error as Error).message}`);
        return false;
      }
      this.logger.error(`Error sending bulk SMS: ${(error as Error).message}`);
      return false;
    }
  }

  async getSmsStatus(messageSid: string): Promise<string | null> {
    if (!this.smsEnabled || !this.client) {
      this.logger.warn('Twilio client not initialized. Cannot get SMS status.');
      return null;
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      this.logger.log(`SMS status retrieved for ${messageSid}: ${message.status}`);
      return message.status;
    } catch (error) {
      this.logger.error(`Error getting SMS status: ${(error as Error).message}`);
      return null;
    }
  }

  getCircuitBreakerStats(): CircuitBreakerStats {
    return this.circuitBreaker.getStats();
  }

  private isValidE164Phone(phone: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phone);
  }
}
