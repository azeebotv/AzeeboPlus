import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  currency?: 'NGN';
  presetAmounts?: number[];
  onPresetSelect?: (amount: number) => void;
  minimumAmount?: number;
  maximumAmount?: number;
}

export function AmountInput({
  value,
  onChangeText,
  label,
  placeholder = 'Enter amount',
  error,
  currency = 'NGN',
  presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000],
  onPresetSelect,
  minimumAmount = 100,
  maximumAmount = 1000000,
}: AmountInputProps) {
  const formatAmount = (amount: string): string => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-NG');
  };

  const handlePresetPress = (amount: number) => {
    onChangeText(amount.toString());
    if (onPresetSelect) {
      onPresetSelect(amount);
    }
  };

  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputError]}>
        <Text style={styles.currencySymbol}>{currencySymbol}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          autoCapitalize="none"
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {value && (
        <Text style={styles.formattedAmount}>
          {currencySymbol}
          {formatAmount(value)}
        </Text>
      )}

      {presetAmounts.length > 0 && (
        <View style={styles.presetsContainer}>
          <Text style={styles.presetsLabel}>Quick amounts:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScroll}
          >
            {presetAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.presetButton,
                  value === amount.toString() && styles.presetButtonActive,
                ]}
                accessibilityLabel={`Select ${currencySymbol}${amount.toLocaleString('en-NG')}`}
                accessibilityRole="button"
                onPress={() => handlePresetPress(amount)}
              >
                <Text
                  style={[
                    styles.presetText,
                    value === amount.toString() && styles.presetTextActive,
                  ]}
                >
                  {currencySymbol}
                  {amount.toLocaleString('en-NG')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.limitsContainer}>
        <Text style={styles.limitText}>
          Min: {currencySymbol}
          {minimumAmount.toLocaleString('en-NG')}
        </Text>
        <Text style={styles.limitText}>
          Max: {currencySymbol}
          {maximumAmount.toLocaleString('en-NG')}
        </Text>
      </View>
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
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  currencySymbol: {
    fontSize: 18,
    color: colors.primary[500],
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error[500],
    fontSize: 12,
    marginTop: 4,
  },
  formattedAmount: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'right',
  },
  presetsContainer: {
    marginTop: 12,
  },
  presetsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  presetsScroll: {
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  presetButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  presetText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  presetTextActive: {
    color: colors.text.primary,
  },
  limitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  limitText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
});
