import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { NativeShareService, ShareContent } from '../utils/nativeShare';
import { colors } from '../theme';

interface ShareButtonProps {
  content: ShareContent;
  onShareComplete?: (success: boolean) => void;
  style?: ViewStyle;
  iconColor?: string;
  size?: number;
}

export function ShareButton({
  content,
  onShareComplete,
  style,
  iconColor = colors.text.primary,
  size = 24,
}: ShareButtonProps): React.ReactElement {
  const handleShare = async () => {
    const success = await NativeShareService.share(content);
    onShareComplete?.(success);
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={`Share ${content.title}`}
      accessibilityHint="Opens share sheet to share content"
    >
      <Text style={[styles.icon, { fontSize: size, color: iconColor }]}>↗</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
