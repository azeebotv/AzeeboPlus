import { TouchableOpacity, TouchableOpacityProps, type GestureResponderEvent } from 'react-native';
import { HapticFeedbackService, HapticFeedbackType } from '../utils/hapticFeedback';

interface HapticButtonProps extends TouchableOpacityProps {
  hapticType?: HapticFeedbackType;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

export function HapticButton({
  hapticType = 'button',
  accessibilityLabel,
  onPress,
  children,
  ...props
}: HapticButtonProps): React.ReactElement {
  const handlePress = async (event: GestureResponderEvent) => {
    await HapticFeedbackService.trigger(hapticType);
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
