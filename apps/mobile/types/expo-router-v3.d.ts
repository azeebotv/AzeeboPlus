// Expo Router v3+ type declarations
// Provides compatibility for expo-router exports

declare module 'expo-router' {
  import { ComponentType, ReactNode } from 'react';

  // Stack navigator
  export const Stack: ComponentType<{
    screenOptions?: Record<string, unknown>;
    children?: ReactNode;
    initialRouteName?: string;
  }> & {
    Screen: ComponentType<{
      name: string;
      options?: Record<string, unknown>;
      style?: unknown[];
      children?: ReactNode;
    }>;
  };

  // Tabs navigator
  export const Tabs: ComponentType<{
    screenOptions?: Record<string, unknown>;
    children?: ReactNode;
    initialRouteName?: string;
  }> & {
    Screen: ComponentType<{
      name: string;
      options?: Record<string, unknown>;
      style?: unknown[];
      children?: ReactNode;
    }>;
  };

  // Link component
  export const Link: ComponentType<{
    href: string;
    children?: ReactNode;
    style?: unknown[];
    asChild?: boolean;
  }>;

  // Router hook
  export function useRouter(): {
    replace: (href: string) => void;
    push: (href: string) => void;
    back: () => void;
    navigate: (href: string) => void;
  };

  // Utility hooks
  export function useLocalSearchParams<T extends Record<string, unknown>>(): Partial<T>;
  /** Runs the callback on focus; the returned cleanup runs on blur. */
  export function useFocusEffect(callback: () => undefined | void | (() => void)): void;
  export function usePathname(): string;
  export function useSegments(): string[];
  export function useRootNavigation(): { getState: () => unknown; addListener: () => () => void };
  export function useNavigationContainerRef(): { getState: () => unknown };

  // Types
  export type Href = `/${string}` | string;
  export interface RouteParameters<T extends string | unknown> {
    params: T;
  }
}

// NodeJS Timeout type for React Native / Expo
declare namespace NodeJS {
  interface Global {
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
  }
}

interface Timeout {
  refresh(): void;
}
