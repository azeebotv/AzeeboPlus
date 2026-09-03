import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SecretData {
  [key: string]: string;
}

interface SecretVersion {
  versionId: string;
  secretString?: string;
  secretBinary?: Buffer;
  createdAt: Date;
}

@Injectable()
export class SecretsManagerService {
  private readonly logger = new Logger(SecretsManagerService.name);
  private readonly secretsCache = new Map<string, { data: SecretData; expiresAt: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(private configService: ConfigService) {}

  /**
   * Get a secret by name
   */
  async getSecret(secretName: string): Promise<SecretData | null> {
    // Check cache first
    const cached = this.secretsCache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      // In production, this would call AWS Secrets Manager
      // For now, we'll use environment variables as a fallback
      const secretData = this.getSecretFromEnvironment(secretName);

      if (secretData) {
        // Cache the secret
        this.secretsCache.set(secretName, {
          data: secretData,
          expiresAt: Date.now() + this.cacheTTL,
        });
        return secretData;
      }

      this.logger.warn(`Secret not found: ${secretName}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get secret ${secretName}:`, error);
      return null;
    }
  }

  /**
   * Get a specific key from a secret
   */
  async getSecretKey(secretName: string, key: string): Promise<string | null> {
    const secret = await this.getSecret(secretName);
    return secret?.[key] || null;
  }

  /**
   * Create or update a secret
   */
  async putSecret(secretName: string, data: SecretData): Promise<void> {
    try {
      // In production, this would call AWS Secrets Manager
      // For now, log the action
      this.logger.log(`Secret updated: ${secretName}`);

      // Update cache
      this.secretsCache.set(secretName, {
        data,
        expiresAt: Date.now() + this.cacheTTL,
      });
    } catch (error) {
      this.logger.error(`Failed to put secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a secret
   */
  async deleteSecret(secretName: string): Promise<void> {
    try {
      // In production, this would call AWS Secrets Manager
      this.logger.log(`Secret deleted: ${secretName}`);

      // Remove from cache
      this.secretsCache.delete(secretName);
    } catch (error) {
      this.logger.error(`Failed to delete secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Rotate a secret (for password rotation)
   */
  async rotateSecret(secretName: string, key: string): Promise<string> {
    const newSecret = this.generateSecureRandom(32);

    const existingSecret = await this.getSecret(secretName);
    if (existingSecret) {
      existingSecret[key] = newSecret;
      await this.putSecret(secretName, existingSecret);
    }

    return newSecret;
  }

  /**
   * Clear the secrets cache
   */
  clearCache(): void {
    this.secretsCache.clear();
    this.logger.log('Secrets cache cleared');
  }

  /**
   * Get secret from environment variables (fallback for development)
   */
  private getSecretFromEnvironment(secretName: string): SecretData | null {
    // Map secret names to environment variable prefixes
    const envPrefixes: Record<string, string[]> = {
      'azeebo/database': ['DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
      'azeebo/redis': ['REDIS_URL', 'REDIS_HOST', 'REDIS_PORT'],
      'azeebo/jwt': ['JWT_SECRET', 'JWT_REFRESH_SECRET'],
      'azeebo/smtp': ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
      'azeebo/stripe': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
      'azeebo/paystack': ['PAYSTACK_SECRET_KEY'],
      'azeebo/flutterwave': ['FLUTTERWAVE_SECRET_KEY'],
      'azeebo/google': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      'azeebo/apple': ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
      'azeebo/firebase': ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY'],
      'azeebo/s3': ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'],
    };

    const envVars = envPrefixes[secretName];
    if (!envVars) {
      return null;
    }

    const secretData: SecretData = {};
    for (const envVar of envVars) {
      const value = this.configService.get<string>(envVar);
      if (value) {
        secretData[envVar] = value;
      }
    }

    return Object.keys(secretData).length > 0 ? secretData : null;
  }

  /**
   * Generate a secure random string
   */
  private generateSecureRandom(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
