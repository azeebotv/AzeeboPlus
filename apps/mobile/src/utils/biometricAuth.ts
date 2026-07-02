import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

/**
 * Typed credentials for biometric storage.
 * SECURITY: Never store JWT tokens or raw auth tokens in biometric storage.
 * Only store non-sensitive identifiers needed for app-launch unlock.
 */
export interface BiometricCredentials {
  userId: string;
  email: string;
  timestamp: number;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

/**
 * Biometric authentication service for app-launch unlock convenience.
 *
 * **This is NOT a token store.** Biometric credentials contain only the
 * non-sensitive identifiers (userId, email) needed to re-display the user's
 * identity on the unlock screen. Actual auth tokens (JWTs) are stored in
 * `expo-secure-store`, which uses hardware-backed Keystore (Android) /
 * Secure Enclave (iOS) for encryption at rest.
 *
 * Flow:
 * 1. On login, `enableBiometrics()` stores userId + email in SecureStore.
 * 2. On app launch, `authenticateWithStoredCredentials()` prompts biometric
 *    verification, then returns the stored identifiers so the UI can show
 *    the user's name/email while the real token refresh happens in the
 *    background.
 * 3. Biometric credentials do NOT contain JWT tokens. If the refresh token
 *    is expired the user must re-enter their password.
 *
 * @see BiometricCredentials - the shape of data stored here
 * @see expo-secure-store - where actual auth tokens live
 */

export class BiometricAuthService {
  static async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      logger.error('Biometric availability check failed', error);
      return false;
    }
  }

  static async getSupportedBiometricType(): Promise<BiometricType> {
    try {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'face';
      }

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      }

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }

      return 'none';
    } catch (error) {
      logger.error('Failed to get biometric type', error);
      return 'none';
    }
  }

  static async authenticate(
    promptMessage: string = 'Authenticate to continue',
    cancelLabel: string = 'Cancel'
  ): Promise<BiometricResult> {
    try {
      const isAvailable = await this.isAvailable();

      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const biometricType = await this.getSupportedBiometricType();

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return {
          success: true,
          biometricType,
        };
      }

      return {
        success: false,
        error: this.getErrorMessage(result.error),
      };
    } catch (error) {
      logger.error('Biometric authentication failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  static async enableBiometrics(credentials: BiometricCredentials): Promise<boolean> {
    try {
      const authResult = await this.authenticate('Enable biometric authentication');

      if (!authResult.success) {
        return false;
      }

      // SECURITY: Validate that credentials do not contain tokens
      const credentialStr = JSON.stringify(credentials);
      if (
        credentialStr.includes('token') ||
        credentialStr.includes('Token') ||
        credentialStr.includes('jwt') ||
        credentialStr.includes('JWT')
      ) {
        logger.error('Attempted to store token-shaped data in biometric storage');
        return false;
      }

      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentialStr);

      return true;
    } catch (error) {
      logger.error('Failed to enable biometrics', error);
      return false;
    }
  }

  static async disableBiometrics(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    } catch (error) {
      logger.error('Failed to disable biometrics', error);
    }
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      logger.error('Failed to check biometric status', error);
      return false;
    }
  }

  static async getStoredCredentials(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    } catch (error) {
      logger.error('Failed to get stored credentials', error);
      return null;
    }
  }

  static async authenticateWithStoredCredentials(): Promise<BiometricResult> {
    try {
      const isEnabled = await this.isBiometricEnabled();

      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is not enabled',
        };
      }

      const authResult = await this.authenticate('Authenticate to access your account');

      if (!authResult.success) {
        return authResult;
      }

      const credentials = await this.getStoredCredentials();

      if (!credentials) {
        return {
          success: false,
          error: 'No stored credentials found',
        };
      }

      return {
        success: true,
        biometricType: authResult.biometricType,
      };
    } catch (error) {
      logger.error('Biometric auth with stored credentials failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  private static getErrorMessage(errorCode?: string): string {
    switch (errorCode) {
      case 'not_available':
        return 'Biometric authentication is not available';
      case 'not_enrolled':
        return 'No biometrics enrolled. Please set up Face ID or Touch ID in Settings.';
      case 'lockout':
        return 'Too many failed attempts. Please try again later.';
      case 'user_cancel':
        return 'Authentication cancelled by user';
      case 'user_fallback':
        return 'User chose to use passcode instead';
      default:
        return 'Authentication failed';
    }
  }
}
