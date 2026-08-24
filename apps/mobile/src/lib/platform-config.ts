import { Platform, Dimensions } from 'react-native';

export const IS_ANDROID = Platform.OS === 'android';
export const IS_IOS = Platform.OS === 'ios';
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PLATFORM_CONFIG = {
  android: { minSdkVersion: 24, targetSdkVersion: 34, compileSdkVersion: 34 },
  ios: { minDeploymentTarget: '15.0' },
} as const;

export function getPlatformValue<T>(android: T, ios: T): T {
  return IS_ANDROID ? android : ios;
}
