import {Inject,  Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { CircuitBreaker, CircuitBreakerOpenError } from '@azeebo/shared-types';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private templates: Record<string, Handlebars.TemplateDelegate> = {};
  private readonly circuitBreaker: CircuitBreaker;
  private emailEnabled: boolean = false;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 3,
    });
  }

  async onModuleInit() {
    const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');

    if (sendgridApiKey) {
      sgMail.setApiKey(sendgridApiKey);
      this.emailEnabled = true;
      this.logger.log('SendGrid initialized successfully');
    } else {
      this.logger.warn('SendGrid API key not configured. Email notifications will be disabled.');
    }

    this.registerTemplates();
  }

  private registerTemplates() {
    // Templates can be overridden via environment variables
    // Format: EMAIL_TEMPLATE_<NAME>_HTML=<html template with Handlebars syntax>
    const templateOverrides: Record<string, string | undefined> = {
      welcome: this.configService.get('EMAIL_TEMPLATE_WELCOME_HTML'),
      'password-reset': this.configService.get('EMAIL_TEMPLATE_PASSWORD_RESET_HTML'),
      'payment-confirmation': this.configService.get('EMAIL_TEMPLATE_PAYMENT_CONFIRMATION_HTML'),
      'content-published': this.configService.get('EMAIL_TEMPLATE_CONTENT_PUBLISHED_HTML'),
      'content-featured': this.configService.get('EMAIL_TEMPLATE_CONTENT_FEATURED_HTML'),
    };

    this.templates['welcome'] = Handlebars.compile(templateOverrides.welcome || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Azeebo+!</h1>
        <p>Hello {{displayName}},</p>
        <p>Thank you for joining Azeebo+. We're excited to have you on board.</p>
        <p>Start exploring our platform and discover amazing content from your favorite creators.</p>
        <p>Best regards,<br>The Azeebo+ Team</p>
      </div>
    `);

    this.templates['password-reset'] = Handlebars.compile(templateOverrides['password-reset'] || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p>Hello {{displayName}},</p>
        <p>We received a request to reset your password. Please use the link below to reset your password:</p>
        <p><a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p>Best regards,<br>The Azeebo+ Team</p>
      </div>
    `);

    this.templates['payment-confirmation'] = Handlebars.compile(templateOverrides['payment-confirmation'] || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Payment Confirmation</h1>
        <p>Hello {{displayName}},</p>
        <p>Your payment of {{currency}}{{amount}} has been successfully processed.</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Transaction ID: {{transactionId}}</li>
          <li>Date: {{date}}</li>
          <li>Description: {{description}}</li>
        </ul>
        <p>Thank you for your purchase!</p>
        <p>Best regards,<br>The Azeebo+ Team</p>
      </div>
    `);

    this.templates['content-published'] = Handlebars.compile(templateOverrides['content-published'] || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your Content Has Been Published</h1>
        <p>Hello {{displayName}},</p>
        <p>Great news! Your content "{{contentTitle}}" has been successfully published and is now available on Azeebo+.</p>
        <p><a href="{{contentLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Content</a></p>
        <p>Best regards,<br>The Azeebo+ Team</p>
      </div>
    `);

    this.templates['content-featured'] = Handlebars.compile(templateOverrides['content-featured'] || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your Content Has Been Featured!</h1>
        <p>Hello {{displayName}},</p>
        <p>Congratulations! Your content "{{contentTitle}}" has been featured on Azeebo+.</p>
        <p>This means more users will discover your content and you'll gain more visibility.</p>
        <p><a href="{{contentLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Featured Content</a></p>
        <p>Keep creating amazing content!</p>
        <p>Best regards,<br>The Azeebo+ Team</p>
      </div>
    `);
  }

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    if (!this.emailEnabled) {
      this.logger.warn('SendGrid not configured. Email not sent.');
      return false;
    }

    const template = this.templates[templateName];
    if (!template) {
      this.logger.error(`Email template ${templateName} not found`);
      return false;
    }

    const html = template(data);

    const msg = {
      to,
      from: this.configService.get('SENDGRID_FROM_EMAIL', 'no-reply@azeebo.plus'),
      subject,
      html,
    };

    try {
      await this.circuitBreaker.execute(async () => {
        await sgMail.send(msg);
      });
      this.logger.log('Email sent successfully to', to);
      return true;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`SendGrid circuit breaker open: ${(error as Error).message}`);
        return false;
      }
      this.logger.error('Error sending email:', error);
      return false;
    }
  }

  async sendCustomEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.emailEnabled) {
      this.logger.warn('SendGrid not configured. Email not sent.');
      return false;
    }

    const msg = {
      to,
      from: this.configService.get('SENDGRID_FROM_EMAIL', 'no-reply@azeebo.plus'),
      subject,
      html,
    };

    try {
      await this.circuitBreaker.execute(async () => {
        await sgMail.send(msg);
      });
      this.logger.log('Custom email sent successfully to', to);
      return true;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`SendGrid circuit breaker open: ${(error as Error).message}`);
        return false;
      }
      this.logger.error('Error sending custom email:', error);
      return false;
    }
  }

  addTemplate(name: string, template: string) {
    // NOTE: Templates should be validated/sanitized before registration to prevent XSS.
    // Consider using a DOMPurify or sanitize-html post-processing step on rendered output.
    if (!name || name.includes('{{')) {
      throw new BadRequestException('Invalid template name');
    }
    this.templates[name] = Handlebars.compile(template);
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}
