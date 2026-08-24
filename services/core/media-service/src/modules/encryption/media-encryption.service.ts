import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * Provider-Side Media Encryption Service (TAA §25)
 *
 * Handles media encryption for premium content:
 * - AES-256-GCM encryption for media assets
 * - Key management and rotation
 * - Encrypted URL generation
 * - Decryption for authorized playback
 */

export interface EncryptionKey {
  /** Key ID */
  id: string;
  /** Key material (base64 encoded) */
  material: string;
  /** Key version */
  version: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Expiration timestamp */
  expiresAt: Date;
  /** Whether key is active */
  active: boolean;
}

export interface EncryptedAsset {
  /** Original asset key */
  originalKey: string;
  /** Encrypted asset key */
  encryptedKey: string;
  /** Encryption key ID used */
  keyId: string;
  /** Encryption algorithm */
  algorithm: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Authentication tag (base64) */
  authTag: string;
  /** Content checksum (for integrity) */
  checksum: string;
}

export interface DecryptionOptions {
  /** Key ID to use for decryption */
  keyId: string;
  /** User ID (for audit) */
  userId: string;
  /** Content ID */
  contentId: string;
}

@Injectable()
export class MediaEncryptionService {
  private readonly logger = new Logger(MediaEncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keySize = 32;
  private readonly ivSize = 16;

  /** In-memory key store (would be KMS in production) */
  private readonly keys = new Map<string, EncryptionKey>();

  constructor() {
    // Initialize with a default key (in production, use AWS KMS or similar)
    this.generateKey();
  }

  /**
   * Generate a new encryption key
   */
  generateKey(expirationDays: number = 90): EncryptionKey {
    const keyMaterial = randomBytes(this.keySize).toString('base64');
    const version = this.keys.size + 1;

    const key: EncryptionKey = {
      id: `key_${version}_${Date.now()}`,
      material: keyMaterial,
      version,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000),
      active: true,
    };

    this.keys.set(key.id, key);
    this.logger.log(`Encryption key generated: ${key.id} (v${version})`);

    return key;
  }

  /**
   * Get the active encryption key
   */
  getActiveKey(): EncryptionKey | undefined {
    const now = new Date();
    return Array.from(this.keys.values()).find((k) => k.active && k.expiresAt > now);
  }

  /**
   * Encrypt a media asset
   */
  async encryptAsset(assetKey: string, data: Buffer): Promise<EncryptedAsset> {
    const key = this.getActiveKey();
    if (!key) {
      throw new Error('No active encryption key available');
    }

    const keyBuffer = Buffer.from(key.material, 'base64');
    const iv = randomBytes(this.ivSize);

    const cipher = createCipheriv(this.algorithm, keyBuffer, iv);

    // Encrypt the data
    cipher.update(data);
    cipher.final();
    const authTag = cipher.getAuthTag();

    // Generate checksum of original data
    const checksum = createHash('sha256').update(data).digest('hex');

    const encryptedAsset: EncryptedAsset = {
      originalKey: assetKey,
      encryptedKey: `${assetKey}.enc`,
      keyId: key.id,
      algorithm: this.algorithm,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      checksum,
    };

    this.logger.log(`Asset encrypted: ${assetKey} → ${encryptedAsset.encryptedKey}`);

    return encryptedAsset;
  }

  /**
   * Decrypt a media asset
   */
  async decryptAsset(encryptedAsset: EncryptedAsset, encryptedData: Buffer): Promise<Buffer> {
    const key = this.keys.get(encryptedAsset.keyId);
    if (!key) {
      throw new Error(`Encryption key ${encryptedAsset.keyId} not found`);
    }

    const keyBuffer = Buffer.from(key.material, 'base64');
    const iv = Buffer.from(encryptedAsset.iv, 'base64');
    const authTag = Buffer.from(encryptedAsset.authTag, 'base64');

    const decipher = createDecipheriv(this.algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    // Verify checksum
    const checksum = createHash('sha256').update(decrypted).digest('hex');
    if (checksum !== encryptedAsset.checksum) {
      throw new Error('Decryption failed: checksum mismatch');
    }

    return decrypted;
  }

  /**
   * Generate encrypted playback URL
   */
  generateEncryptedUrl(asset: EncryptedAsset, expiresIn: number = 600): string {
    const payload = {
      key: asset.encryptedKey,
      kid: asset.keyId,
      iv: asset.iv,
      exp: Date.now() + expiresIn * 1000,
    };

    const signature = createHash('sha256')
      .update(JSON.stringify(payload) + process.env.ENCRYPTION_SECRET)
      .digest('hex');

    return `/encrypted/${Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64url')}`;
  }

  /**
   * Validate encrypted URL
   */
  validateEncryptedUrl(url: string): {
    valid: boolean;
    assetKey?: string;
    keyId?: string;
    error?: string;
  } {
    try {
      const token = url.replace('/encrypted/', '');
      const payload = JSON.parse(Buffer.from(token, 'base64url').toString());

      // Verify signature
      const { sig, ...data } = payload;
      const expectedSig = createHash('sha256')
        .update(JSON.stringify(data) + process.env.ENCRYPTION_SECRET)
        .digest('hex');

      if (sig !== expectedSig) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Check expiration
      if (payload.exp < Date.now()) {
        return { valid: false, error: 'URL expired' };
      }

      return {
        valid: true,
        assetKey: payload.key,
        keyId: payload.kid,
      };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKey(): Promise<EncryptionKey> {
    // Deactivate old keys
    for (const key of this.keys.values()) {
      key.active = false;
    }

    // Generate new key
    return this.generateKey();
  }

  /**
   * Get key statistics
   */
  getStats(): {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
  } {
    const now = new Date();
    const keys = Array.from(this.keys.values());

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter((k) => k.active && k.expiresAt > now).length,
      expiredKeys: keys.filter((k) => k.expiresAt <= now).length,
    };
  }
}
