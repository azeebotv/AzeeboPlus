import { useCallback } from 'react';
import { HapticFeedbackService, HapticFeedbackType } from '../utils/hapticFeedback';

export function useHaptic() {
  const trigger = useCallback(async (type: HapticFeedbackType = 'medium') => {
    await HapticFeedbackService.trigger(type);
  }, []);

  const buttonPress = useCallback(async () => {
    await HapticFeedbackService.buttonPress();
  }, []);

  const success = useCallback(async () => {
    await HapticFeedbackService.success();
  }, []);

  const error = useCallback(async () => {
    await HapticFeedbackService.error();
  }, []);

  const selection = useCallback(async () => {
    await HapticFeedbackService.selection();
  }, []);

  const enable = useCallback(() => {
    HapticFeedbackService.enable();
  }, []);

  const disable = useCallback(() => {
    HapticFeedbackService.disable();
  }, []);

  const toggle = useCallback(() => {
    return HapticFeedbackService.toggle();
  }, []);

  return {
    trigger,
    buttonPress,
    success,
    error,
    selection,
    enable,
    disable,
    toggle,
  };
}
