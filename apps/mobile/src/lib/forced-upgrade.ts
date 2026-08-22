import { Linking, Alert } from 'react-native';
import { Platform } from 'react-native';

const STORE_URLS = {
  ios: 'https://apps.apple.com/app/azeebo-plus/id000000000',
  android: 'https://play.google.com/store/apps/details?id=com.azeebo.plus',
};

export interface VersionCheckResult {
  currentVersion: string;
  minimumVersion: string;
  latestVersion: string;
  needsUpgrade: boolean;
  isForced: boolean;
}

export function checkVersion(current: string, minimum: string, latest: string): VersionCheckResult {
  const currentNum = parseVersion(current);
  const minimumNum = parseVersion(minimum);
  const latestNum = parseVersion(latest);
  return {
    currentVersion: current,
    minimumVersion: minimum,
    latestVersion: latest,
    needsUpgrade: currentNum < minimumNum,
    isForced: currentNum < minimumNum,
  };
}

function parseVersion(v: string): number {
  const parts = v.replace(/[^0-9.]/g, '').split('.').map(Number);
  return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}

export async function handleForcedUpgrade(minimumVersion: string, latestVersion: string, currentVersion: string): Promise<boolean> {
  const result = checkVersion(currentVersion, minimumVersion, latestVersion);
  if (!result.needsUpgrade) return true;
  const storeUrl = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
  return new Promise((resolve) => {
    Alert.alert(
      'Update Required',
      `This version is no longer supported. Please update to version ${latestVersion} or later.`,
      [
        { text: 'Update Now', onPress: () => { Linking.openURL(storeUrl); resolve(false); } },
      ],
      { cancelable: false },
    );
  });
}

export async function checkForUpdate(currentVersion: string, latestVersion: string, minimumVersion: string): Promise<void> {
  const result = checkVersion(currentVersion, minimumVersion, latestVersion);
  if (result.isForced) {
    await handleForcedUpgrade(minimumVersion, latestVersion, currentVersion);
  } else if (currentVersion !== latestVersion) {
    const storeUrl = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
    Alert.alert('Update Available', `Version ${latestVersion} is available.`, [
      { text: 'Update', onPress: () => Linking.openURL(storeUrl) },
      { text: 'Later', style: 'cancel' },
    ]);
  }
}

