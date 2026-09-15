import { Share, Alert, Platform } from 'react-native';
import { logger } from '@azeebo/react-data/utils/logger';

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
}

export class NativeShareService {
  static async share(content: ShareContent): Promise<boolean> {
    try {
      const result = await Share.share({
        title: content.title,
        message: content.url ? `${content.message}\n\n${content.url}` : content.message,
        url: content.url,
      });

      if (result.action === Share.sharedAction) {
        return true;
      } else if (result.action === Share.dismissedAction) {
        return false;
      }

      return false;
    } catch (error) {
      logger.error('Native share failed', error);
      Alert.alert('Share Failed', 'Unable to share content. Please try again.');
      return false;
    }
  }

  static async shareContent(
    title: string,
    description: string,
    contentUrl: string
  ): Promise<boolean> {
    return this.share({
      title,
      message: description,
      url: contentUrl,
    });
  }

  static async shareWithFallback(content: ShareContent): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          await navigator.share({
            title: content.title,
            text: content.message,
            url: content.url,
          });
          return true;
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            return false;
          }
          logger.error('Web share failed', error);
          return false;
        }
      }

      try {
        // @ts-expect-error navigator is a web-only global
        await navigator.clipboard.writeText(
          `${content.title}\n\n${content.message}\n\n${content.url || ''}`
        );
        Alert.alert('Copied', 'Content copied to clipboard');
        return true;
      } catch {
        return false;
      }
    }

    return this.share(content);
  }
}
