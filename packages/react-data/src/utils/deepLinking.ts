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

  /**
   * L6: canonical fund-the-wallet deep link. The fund flow lives at
   * `/(tabs)/wallet/add-funds` on mobile and `/wallet/fund` on TV; this link
   * plus the resolver in handleDeepLink means callers don't special-case
   * each surface's path spelling.
   */
  static createFundLink(): string {
    return Linking.createURL('/wallet/fund');
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
      // Route ids are URL-encoded defensively — deep-link payloads are
      // attacker-controllable and pushed straight into the router.
      const safeId = data.id ? encodeURIComponent(data.id) : undefined;
      switch (data.type) {
        case 'content':
          // Content links open the actual watch screen — home never consumed
          // the contentId param, so shared content links landed on the feed.
          if (safeId) router.push(`/watch/${safeId}`);
          break;
        case 'universe':
        case 'creator':
          router.push('/(tabs)/home');
          break;
        case 'referral':
          if (safeId) router.push(`/(auth)/register?referral=${safeId}`);
          break;
        case 'payment':
          router.push('/(tabs)/wallet');
          break;
        case 'wallet':
          // L6 route aliases: `wallet/fund` and `wallet/add-funds` both land
          // on mobile's add-funds screen regardless of which spelling the
          // producing surface (or an old push notification) used.
          if (safeId === 'fund' || safeId === 'add-funds') {
            router.push('/(tabs)/wallet/add-funds');
          } else {
            router.push('/(tabs)/wallet');
          }
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
