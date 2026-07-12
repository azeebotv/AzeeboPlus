import {Inject,  Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import {
  initializeApp,
  cert,
  getApps,
  getApp,
  deleteApp,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { ConfigService } from '@nestjs/config';
import { CircuitBreaker, CircuitBreakerOpenError, CircuitBreakerStats } from '@azeebo/shared-types';

@Injectable()
export class FirebaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FirebaseService.name);
  private messaging!: Messaging;
  private firebaseEnabled: boolean = false;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 3,
    });
  }

  async onModuleInit(): Promise<void> {
    const serviceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT');

    if (!serviceAccount) {
      this.logger.warn(
        'Firebase service account not configured. Push notifications will be disabled.'
      );
      return;
    }

    try {
      const app =
        getApps().length === 0
          ? initializeApp({ credential: cert(serviceAccount as ServiceAccount) })
          : getApp();

      this.messaging = getMessaging(app);
      this.firebaseEnabled = true;
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error(`Error initializing Firebase: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.firebaseEnabled) {
      try {
        if (getApps().length > 0) {
          await deleteApp(getApp());
        }
        this.logger.log('Firebase app cleaned up successfully');
      } catch (error) {
        this.logger.error(`Error cleaning up Firebase: ${(error as Error).message}`);
      }
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.firebaseEnabled || !this.messaging) {
      this.logger.warn('Firebase messaging not initialized. Push notification not sent.');
      return false;
    }

    try {
      const message = {
        token,
        notification: {
          title,
          body,
        },
        data,
      };

      await this.circuitBreaker.execute(async () => {
        await this.messaging.send(message);
      });

      this.logger.log(`Push notification sent successfully to ${token.slice(0, 8)}...`);
      return true;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Firebase circuit breaker open: ${(error as Error).message}`);
        return false;
      }
      this.logger.error(`Error sending push notification: ${(error as Error).message}`);
      return false;
    }
  }

  async sendMulticastNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.firebaseEnabled || !this.messaging) {
      this.logger.warn('Firebase messaging not initialized. Push notification not sent.');
      return false;
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data,
        tokens,
      };

      await this.circuitBreaker.execute(async () => {
        await this.messaging.sendEachForMulticast(message);
      });

      this.logger.log(`Multicast push notification sent to ${tokens.length} tokens`);
      return true;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Firebase circuit breaker open: ${(error as Error).message}`);
        return false;
      }
      this.logger.error(`Error sending multicast push notification: ${(error as Error).message}`);
      return false;
    }
  }

  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    if (!this.firebaseEnabled || !this.messaging) {
      this.logger.warn('Firebase messaging not initialized. Subscription not processed.');
      return false;
    }

    try {
      await this.circuitBreaker.execute(async () => {
        await this.messaging.subscribeToTopic(token, topic);
      });

      this.logger.log(`Subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Firebase circuit breaker open: ${(error as Error).message}`);
        return false;
      }
      this.logger.error(`Error subscribing to topic: ${(error as Error).message}`);
      return false;
    }
  }

  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    if (!this.firebaseEnabled || !this.messaging) {
      this.logger.warn('Firebase messaging not initialized. Unsubscription not processed.');
      return false;
    }

    try {
      await this.circuitBreaker.execute(async () => {
        await this.messaging.unsubscribeFromTopic(token, topic);
      });

      this.logger.log(`Unsubscribed from topic: ${topic}`);
      return true;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Firebase circuit breaker open: ${(error as Error).message}`);
        return false;
      }
      this.logger.error(`Error unsubscribing from topic: ${(error as Error).message}`);
      return false;
    }
  }

  getCircuitBreakerStats(): CircuitBreakerStats {
    return this.circuitBreaker.getStats();
  }
}
