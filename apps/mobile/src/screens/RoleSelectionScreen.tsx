import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { useRole } from '../hooks/useRole';
import { colors, fontSize, fontWeight, spacing, screenPadding } from '../theme';

export function RoleSelectionScreen() {
  const { setRole } = useRole();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing['2xl'] }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido a LinkDN</Text>
        <Text style={styles.subtitle}>Como quieres usar la app?</Text>
      </View>

      <View style={styles.cards}>
        <Card
          onPress={() => setRole('provider')}
          style={styles.roleCard}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>B</Text>
          </View>
          <Text style={styles.roleTitle}>Ofrecer servicios</Text>
          <Text style={styles.roleDesc}>
            Crea tu perfil profesional, gestiona servicios y recibe reservas de clientes.
          </Text>
        </Card>

        <Card
          onPress={() => setRole('client')}
          style={styles.roleCard}
        >
          <View style={[styles.iconCircle, styles.iconCircleClient]}>
            <Text style={styles.iconEmoji}>E</Text>
          </View>
          <Text style={styles.roleTitle}>Buscar servicios</Text>
          <Text style={styles.roleDesc}>
            Encuentra profesionales, agenda citas y gestiona tus reservas.
          </Text>
        </Card>
      </View>

      <Text style={styles.footnote}>
        Puedes cambiar en cualquier momento desde tu perfil
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
    ...screenPadding,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.neutral700,
  },
  cards: {
    gap: spacing.md,
  },
  roleCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconCircleClient: {
    backgroundColor: colors.infoLight,
  },
  iconEmoji: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  roleTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
  },
  roleDesc: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    textAlign: 'center',
    lineHeight: 20,
  },
  footnote: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
});
