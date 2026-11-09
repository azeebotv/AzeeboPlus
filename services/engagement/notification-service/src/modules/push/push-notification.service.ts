import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, type App, cert, getApps } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private app: App | null = null;
  private messaging: Messaging | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const projectId = this.configService.get('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        // Dev .env files carry `FIREBASE_PRIVATE_KEY=your-firebase-private-key`;
        // handing that to cert() throws FirebaseAppError "Failed to parse
        // private key" (ERROR + stack) even though the graceful path below
        // handles absence fine. Detect non-PEM values up front and take the
        // warn path instead — real keys always contain the PEM header after
        // the \n unescape.
        if (!privateKey.includes('-----BEGIN')) {
          this.logger.warn(
            'FIREBASE_PRIVATE_KEY is not a PEM (placeholder value?) — push notifications disabled'
          );
          return;
        }
        if (getApps().length === 0) {
          this.app = initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
          });
        } else {
          this.app = getApps()[0];
        }
        this.messaging = getMessaging(this.app);
        this.logger.log('Firebase Admin SDK initialized');
      } else {
        this.logger.warn('Firebase credentials not configured, push notifications disabled');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }

  async sendToToken(token: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.messaging) {
      this.logger.warn('Firebase not initialized, skipping push notification');
      return false;
    }
    try {
      await this.messaging.send({
        token,
        notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
        data: payload.data || {},
        android: { priority: 'high', notification: { channelId: 'azeebo-notifications' } },
        apns: {
          payload: {
            aps: {
              alert: { title: payload.title, body: payload.body },
              badge: 1,
              sound: 'default',
            },
          },
        },
      });
      this.logger.log('Push notification sent');
      return true;
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      return false;
    }
  }

  async sendToMultipleTokens(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<{ success: number; failure: number }> {
    if (!this.messaging || tokens.length === 0) return { success: 0, failure: tokens.length };
    try {
      const response = await this.messaging.sendEachForMulticast({
        tokens,
        notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
        data: payload.data || {},
      });
      this.logger.log(`Push: ${response.successCount} success, ${response.failureCount} failure`);
      return { success: response.successCount, failure: response.failureCount };
    } catch (error) {
      this.logger.error('Failed to send push notifications:', error);
      return { success: 0, failure: tokens.length };
    }
  }

  async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.messaging) return false;
    try {
      await this.messaging.send({
        topic,
        notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
        data: payload.data || {},
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to send topic notification:', error);
      return false;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.messaging) return;
    try {
      await this.messaging.subscribeToTopic(tokens, topic);
    } catch (error) {
      this.logger.error('Failed to subscribe to topic:', error);
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.messaging) return;
    try {
      await this.messaging.unsubscribeFromTopic(tokens, topic);
    } catch (error) {
      this.logger.error('Failed to unsubscribe from topic:', error);
    }
  }
}
