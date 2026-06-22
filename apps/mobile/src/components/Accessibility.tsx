import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  AccessibilityProps,
  AccessibilityRole,
} from 'react-native';

interface AccessibleButtonProps extends AccessibilityProps {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onPress,
  title,
  style,
  textStyle,
  disabled = false,
  variant = 'primary',
  ...accessibilityProps
}) => {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'outline' && styles.buttonOutline,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && styles.buttonTextPrimary,
    variant === 'secondary' && styles.buttonTextSecondary,
    variant === 'outline' && styles.buttonTextOutline,
    disabled && styles.buttonTextDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={buttonStyles}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityProps.accessibilityLabel || title}
      accessibilityHint={accessibilityProps.accessibilityHint}
      {...accessibilityProps}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

interface AccessibleCardProps extends AccessibilityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  children,
  style,
  onPress,
  ...accessibilityProps
}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityProps.accessibilityLabel}
        accessibilityHint={accessibilityProps.accessibilityHint}
        {...accessibilityProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]} accessibilityRole="none" {...accessibilityProps}>
      {children}
    </View>
  );
};

interface AccessibleListItemProps extends AccessibilityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const AccessibleListItem: React.FC<AccessibleListItemProps> = ({
  children,
  style,
  onPress,
  ...accessibilityProps
}) => {
  const content = <View style={[styles.listItem, style]}>{children}</View>;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityProps.accessibilityLabel}
        accessibilityHint={accessibilityProps.accessibilityHint}
        {...accessibilityProps}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View accessibilityRole="none" {...accessibilityProps}>
      {content}
    </View>
  );
};

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => (
  <View style={styles.srOnly}>{children}</View>
);

interface VisuallyHiddenTextProps {
  text: string;
  accessibilityLabel?: string;
}

export const VisuallyHiddenText: React.FC<VisuallyHiddenTextProps> = ({
  text,
  accessibilityLabel,
}) => (
  <Text style={styles.srOnly} accessibilityLabel={accessibilityLabel || text}>
    {text}
  </Text>
);

export const colors = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
  },
  bg: {
    primary: '#FFFFFF',
    secondary: '#F3F4F6',
    tertiary: '#E5E7EB',
  },
  border: '#D1D5DB',
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: '#FFFFFF',
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  buttonTextDisabled: {
    color: colors.text.tertiary,
  },
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
});

export default {
  AccessibleButton,
  AccessibleCard,
  AccessibleListItem,
  ScreenReaderOnly,
  VisuallyHiddenText,
  colors,
};
