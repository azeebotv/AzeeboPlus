import React from 'react';
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
    color: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#E8420A',
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  formattedAmount: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  presetsContainer: {
    marginTop: 12,
  },
  presetsLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  presetsScroll: {
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  presetButtonActive: {
    backgroundColor: '#E8420A',
    borderColor: '#E8420A',
  },
  presetText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  presetTextActive: {
    color: '#fff',
  },
  limitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  limitText: {
    fontSize: 11,
    color: '#666',
  },
});
