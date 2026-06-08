import { useState, useCallback } from 'react';
import { NativeShareService, ShareContent } from '../utils/nativeShare';

interface UseShareState {
  isSharing: boolean;
  error: string | null;
}

export function useShare() {
  const [state, setState] = useState<UseShareState>({
    isSharing: false,
    error: null,
  });

  const share = useCallback(async (content: ShareContent): Promise<boolean> => {
    setState({ isSharing: true, error: null });

    try {
      const success = await NativeShareService.share(content);
      setState({ isSharing: false, error: null });
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Share failed';
      setState({ isSharing: false, error: message });
      return false;
    }
  }, []);

  const shareContent = useCallback(
    async (title: string, message: string, url: string): Promise<boolean> => {
      return share({ title, message, url });
    },
    [share]
  );

  return {
    ...state,
    share,
    shareContent,
  };
}
