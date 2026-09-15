/**
 * Ambient declarations for TV remote key handling.
 *
 * React Native 0.85 ships the Android TV / tvOS key events (KeyDown/KeyUp with
 * keyCode for D-pad and media buttons) but does not export a typed
 * `useTVEventHandler` from core (that lives in the community `@react-native-tvos/*`
 * fork). We declare a minimal typed surface here so the watch screen can
 * consume remote keys portably; when the project adopts the tvOS fork's
 * packages, this file can be deleted in favor of their types.
 */
import type { EmitterSubscription } from 'react-native';

declare module 'react-native' {
  export interface TVKeyboardEvent {
    eventKeyAlias: string;
    eventKeyName: string;
    eventType: 'keydown' | 'keyup';
    keyCode: number;
  }

  /**
   * Fires for hardware key events on Android TV / Fire TV / tvOS when a
   * Touchable/View does not consume them.
   */
  export function addListener(
    eventType: 'keyDown' | 'keyUp',
    listener: (event: TVKeyboardEvent) => void
  ): EmitterSubscription;
}
