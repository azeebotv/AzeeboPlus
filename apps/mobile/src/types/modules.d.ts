declare module 'react-i18next' {
  export function useTranslation(): {
    t: (key: string, fallback?: string) => string;
    i18n: { language: string };
  };
  export function Trans(props: { i18nKey: string; children?: React.ReactNode }): React.ReactElement;
  export function initReactI18next(): {
    type: string;
    init: (options: { resources: unknown; lng: string; fallbackLng: string; interpolation: { escapeValue: boolean } }) => void;
  };
}

declare module '@expo/vector-icons' {
  export { default as Ionicons } from '@expo/vector-icons/Ionicons';
  export { default as MaterialIcons } from '@expo/vector-icons/MaterialIcons';
  export { default as FontAwesome } from '@expo/vector-icons/FontAwesome';
  export { default as MaterialCommunityIcons } from '@expo/vector-icons/MaterialCommunityIcons';
}

declare module '@expo/vector-icons/Ionicons' {
  import { ComponentType } from 'react';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ionicons: ComponentType<{ name: string; size?: number; color?: string; style?: any }>;
  export default Ionicons;
}

declare module '@expo/vector-icons/MaterialIcons' {
  import { ComponentType } from 'react';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MaterialIcons: ComponentType<{ name: string; size?: number; color?: string; style?: any }>;
  export default MaterialIcons;
}

declare module '@expo/vector-icons/FontAwesome' {
  import { ComponentType } from 'react';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FontAwesome: ComponentType<{ name: string; size?: number; color?: string; style?: any }>;
  export default FontAwesome;
}

declare module '@expo/vector-icons/MaterialCommunityIcons' {
  import { ComponentType } from 'react';
  const MaterialCommunityIcons: ComponentType<{
    name: string;
    size?: number;
    color?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style?: any;
  }>;
  export default MaterialCommunityIcons;
}

declare module 'expo-linear-gradient' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewStyle } from 'react-native';
  export interface LinearGradientProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    style?: ViewStyle | ViewStyle[];
    children?: ReactNode;
  }
  export const LinearGradient: ComponentType<LinearGradientProps>;
}

declare module 'expo-updates' {
  export const channel: string | undefined;
  export function checkForUpdateAsync(): Promise<{ isAvailable: boolean }>;
  export function fetchUpdateAsync(): Promise<boolean>;
  export function reloadAsync(): Promise<void>;
}
