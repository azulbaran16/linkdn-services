import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../theme';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: colors.primaryLight, text: colors.primary },
  success: { bg: colors.successLight, text: colors.success },
  danger: { bg: colors.dangerLight, text: colors.danger },
  warning: { bg: colors.warningLight, text: colors.warning },
  info: { bg: colors.infoLight, text: colors.info },
  neutral: { bg: colors.neutral100, text: colors.neutral700 },
};

export function Badge({ label, variant = 'primary', style }: BadgeProps) {
  const { bg, text } = variantColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.ms,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
