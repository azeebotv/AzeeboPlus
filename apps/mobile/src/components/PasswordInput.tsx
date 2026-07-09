import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  testID?: string;
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Enter password',
  label,
  error,
  testID,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          testID={testID}
        />
        <TouchableOpacity
          style={styles.showButton}
          onPress={() => setShowPassword(!showPassword)}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          testID={testID ? `${testID}-toggle` : 'password-toggle'}
        >
          <Text style={styles.showButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  showButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  showButtonText: {
    color: colors.primary[500],
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
