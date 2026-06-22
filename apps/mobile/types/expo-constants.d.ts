// Expo Constants type declarations
declare module 'expo-constants' {
  export const Constants: {
    manifest: {
      name: string;
      slug: string;
      version: string;
      orientation: string;
      icon: string;
      userInterfaceStyle: string;
      backgroundColor: string;
      scheme: string;
      plugins: unknown[];
    };
    expoConfig: {
      version: string;
      name: string;
      slug: string;
    };
    statusBarHeight: number;
    executionEnvironment: string;
  };
}