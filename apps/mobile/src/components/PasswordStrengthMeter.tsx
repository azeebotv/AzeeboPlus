import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  requirements: {
    met: boolean;
    text: string;
  }[];
}

export function PasswordStrengthMeter({ password, onStrengthChange }: PasswordStrengthMeterProps) {
  const strength = useMemo((): StrengthResult => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[a-z]/.test(password), text: 'One lowercase letter' },
      { met: /[0-9]/.test(password), text: 'One number' },
      { met: /[^A-Za-z0-9]/.test(password), text: 'One special character' },
    ];

    const score = requirements.filter((r) => r.met).length;

    let label: string;
    let color: string;

    switch (score) {
      case 0:
      case 1:
        label = 'Very Weak';
        color = colors.error;
        break;
      case 2:
        label = 'Weak';
        color = colors.warning[500];
        break;
      case 3:
        label = 'Fair';
        color = '#F39C12';
        break;
      case 4:
        label = 'Strong';
        color = colors.success[500];
        break;
      case 5:
        label = 'Very Strong';
        color = colors.success;
        break;
      default:
        label = '';
        color = '';
    }

    if (onStrengthChange) {
      onStrengthChange(score);
    }

    return { score, label, color, requirements };
  }, [password, onStrengthChange]);

  if (!password) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.barSegment,
              level <= strength.score && { backgroundColor: strength.color },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: strength.color }]}>{strength.label}</Text>
      <View style={styles.requirements}>
        {strength.requirements.map((req, index) => (
          <View key={index} style={styles.requirementItem}>
            <Text style={[styles.requirementIcon, req.met && styles.requirementMet]}>
              {req.met ? '✓' : '✗'}
            </Text>
            <Text style={[styles.requirementText, req.met && styles.requirementTextMet]}>
              {req.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  barContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  barSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirements: {
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementIcon: {
    fontSize: 12,
    color: '#666',
    width: 16,
    textAlign: 'center',
  },
  requirementMet: {
    color: colors.success[500],
  },
  requirementText: {
    fontSize: 12,
    color: '#888',
  },
  requirementTextMet: {
    color: '#fff',
  },
});
