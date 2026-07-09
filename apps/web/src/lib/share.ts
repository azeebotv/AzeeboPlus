import { webLogger } from '@/lib/logger';
interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Web Share API utility for sharing content
 * Falls back to clipboard copy if Web Share API is not supported
 */
export class ShareService {
  /**
   * Check if Web Share API is supported
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }

  /**
   * Share content using Web Share API
   * Falls back to clipboard copy if not supported
   */
  static async share(data: ShareData): Promise<boolean> {
    try {
      if (this.isSupported()) {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        return true;
      }

      // Fallback to clipboard
      await this.copyToClipboard(data);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled share
        return false;
      }
      webLogger.error('Share failed', error);
      return false;
    }
  }

  /**
   * Copy share data to clipboard as fallback
   */
  private static async copyToClipboard(data: ShareData): Promise<void> {
    const text = `${data.title}\n\n${data.text}\n\n${data.url}`;

    if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
      await navigator.clipboard.writeText(text);
    } else if (typeof document !== 'undefined') {
      // Fallback for older browsers using deprecated execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  /**
   * Share content with native share sheet (mobile-optimized)
   */
  static async shareNative(data: ShareData): Promise<boolean> {
    if (!this.isSupported()) {
      return this.share(data);
    }

    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return false;
      }
      webLogger.error('Native share failed', error);
      return this.share(data);
    }
  }
}

/**
 * Hook for using share functionality in React components
 */
export function useShare() {
  const share = async (data: ShareData) => {
    return ShareService.share(data);
  };

  const shareNative = async (data: ShareData) => {
    return ShareService.shareNative(data);
  };

  return {
    share,
    shareNative,
    isSupported: ShareService.isSupported(),
  };
}
