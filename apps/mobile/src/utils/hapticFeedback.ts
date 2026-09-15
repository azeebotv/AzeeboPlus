import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { logger } from '@azeebo/react-data/utils/logger';

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'button'
  | 'swipe'
  | 'pull';

export class HapticFeedbackService {
  private static isEnabled = true;

  static enable(): void {
    this.isEnabled = true;
  }

  static disable(): void {
    this.isEnabled = false;
  }

  static toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  static async trigger(type: HapticFeedbackType = 'medium'): Promise<void> {
    if (!this.isEnabled || Platform.OS === 'web') {
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        case 'button':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'swipe':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'pull':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (error) {
      logger.error('Haptic feedback failed', error);
    }
  }

  static async buttonPress(): Promise<void> {
    await this.trigger('button');
  }

  static async success(): Promise<void> {
    await this.trigger('success');
  }

  static async error(): Promise<void> {
    await this.trigger('error');
  }

  static async selection(): Promise<void> {
    await this.trigger('selection');
  }
}
