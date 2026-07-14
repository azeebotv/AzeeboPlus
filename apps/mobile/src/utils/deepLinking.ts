import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { logger } from './logger';

const PREFIX = Linking.createURL('/');

export type DeepLinkType = 'content' | 'universe' | 'creator' | 'referral' | 'payment' | 'wallet';

const VALID_DEEP_LINK_TYPES: ReadonlySet<string> = new Set<DeepLinkType>([
  'content',
  'universe',
  'creator',
  'referral',
  'payment',
  'wallet',
]);

export interface DeepLinkData {
  type: DeepLinkType;
  id?: string;
  params?: Record<string, string>;
  rawUrl: string;
}

export class DeepLinkService {
  static getPrefix(): string {
    return PREFIX;
  }

  static createContentLink(contentId: string, _title?: string): string {
    const url = Linking.createURL(`/content/${contentId}`);
    return url;
  }

  static createUniverseLink(universeId: string): string {
    return Linking.createURL(`/universe/${universeId}`);
  }

  static createCreatorLink(creatorId: string): string {
    return Linking.createURL(`/creator/${creatorId}`);
  }

  static createReferralLink(referralCode: string): string {
    return Linking.createURL(`/referral/${referralCode}`);
  }

  static createPaymentLink(paymentId: string): string {
    return Linking.createURL(`/payment/${paymentId}`);
  }

  static createWalletLink(): string {
    return Linking.createURL('/wallet');
  }

  static parseUrl(url: string): DeepLinkData | null {
    try {
      const parsed = Linking.parse(url);

      if (!parsed.path) {
        return null;
      }

      const pathParts = parsed.path.split('/').filter(Boolean);

      if (pathParts.length === 0) {
        return null;
      }

      const rawType = pathParts[0];
      if (!VALID_DEEP_LINK_TYPES.has(rawType)) {
        logger.warn('Unknown deep link type rejected', undefined, { type: rawType });
        return null;
      }
      const type = rawType as DeepLinkType;
      const id = pathParts[1];
      const params = parsed.queryParams as Record<string, string> | undefined;

      return {
        type,
        id,
        params,
        rawUrl: url,
      };
    } catch (error) {
      logger.error('Failed to parse deep link', error);
      return null;
    }
  }

  static async openUrl(url: string): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to open URL', error);
      return false;
    }
  }

  static getShareText(title: string, description: string, contentId: string): string {
    const link = this.createContentLink(contentId, title);
    return `${title}\n\n${description}\n\nOpen in Azeebo+: ${link}`;
  }

  /**
   * Handle an incoming deep link by parsing it and navigating to the correct screen.
   * Call this from the app's URL event listener (Linking.addEventListener('url', ...)).
   */
  static handleDeepLink(url: string, router: ReturnType<typeof useRouter>): boolean {
    const data = this.parseUrl(url);
    if (!data) {
      logger.warn('Failed to handle deep link', undefined, { url });
      return false;
    }

    try {
      switch (data.type) {
        case 'content':
          router.push(`/(tabs)/home?contentId=${data.id}`);
          break;
        case 'universe':
          router.push(`/(tabs)/home?universeId=${data.id}`);
          break;
        case 'creator':
          router.push(`/(tabs)/home?creatorId=${data.id}`);
          break;
        case 'referral':
          router.push(`/(auth)/register?referral=${data.id}`);
          break;
        case 'payment':
          router.push(`/(tabs)/wallet?paymentId=${data.id}`);
          break;
        case 'wallet':
          router.push('/(tabs)/wallet');
          break;
        default:
          logger.warn('Unhandled deep link type', undefined, { type: data.type });
          return false;
      }
      return true;
    } catch (error) {
      logger.error('Failed to navigate from deep link', error);
      return false;
    }
  }
}
