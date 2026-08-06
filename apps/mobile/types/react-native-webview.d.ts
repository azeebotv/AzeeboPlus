declare module 'react-native-webview' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface WebViewProps extends ViewProps {
    source?: { uri?: string; html?: string; baseUrl?: string };
    javaScriptEnabled?: boolean;
    domStorageEnabled?: boolean;
    startInLoadingState?: boolean;
    allowsFullscreenVideo?: boolean;
    style?: object;
    onLoad?: () => void;
    onError?: (event: unknown) => void;
  }

  export const WebView: ComponentType<WebViewProps>;
}
