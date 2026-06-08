import { useEffect, useState, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { DeepLinkService, DeepLinkData } from '../utils/deepLinking';

interface UseDeepLinkState {
  url: string | null;
  parsedLink: DeepLinkData | null;
  isLoading: boolean;
  error: string | null;
}

export function useDeepLink() {
  const [state, setState] = useState<UseDeepLinkState>({
    url: null,
    parsedLink: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const parsed = DeepLinkService.parseUrl(initialUrl);
          setState({
            url: initialUrl,
            parsedLink: parsed,
            isLoading: false,
            error: null,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setState({
          url: null,
          parsedLink: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to get initial URL',
        });
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = DeepLinkService.parseUrl(url);
      setState({
        url,
        parsedLink: parsed,
        isLoading: false,
        error: null,
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const createContentLink = useCallback((contentId: string): string => {
    return DeepLinkService.createContentLink(contentId);
  }, []);

  const createUniverseLink = useCallback((universeId: string): string => {
    return DeepLinkService.createUniverseLink(universeId);
  }, []);

  const createReferralLink = useCallback((referralCode: string): string => {
    return DeepLinkService.createReferralLink(referralCode);
  }, []);

  return {
    ...state,
    createContentLink,
    createUniverseLink,
    createReferralLink,
  };
}
