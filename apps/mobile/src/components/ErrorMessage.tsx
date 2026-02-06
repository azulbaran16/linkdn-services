import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, borderRadius, spacing } from '../theme';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fce4e4',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
});
