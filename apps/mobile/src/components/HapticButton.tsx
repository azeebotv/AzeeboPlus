import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { HapticFeedbackService, HapticFeedbackType } from '../utils/hapticFeedback';

interface HapticButtonProps extends TouchableOpacityProps {
  hapticType?: HapticFeedbackType;
  children: React.ReactNode;
}

export function HapticButton({
  hapticType = 'button',
  onPress,
  children,
  ...props
}: HapticButtonProps): React.ReactElement {
  const handlePress = async (event: any) => {
    await HapticFeedbackService.trigger(hapticType);
    onPress?.(event);
  };

  return (
    <TouchableOpacity onPress={handlePress} {...props}>
      {children}
    </TouchableOpacity>
  );
}
