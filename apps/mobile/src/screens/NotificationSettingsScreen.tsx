import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing, borderRadius, screenPadding, shadows } from '../theme';

const STORAGE_KEY = 'notification_prefs';

interface NotificationPrefs {
  pushEnabled: boolean;
  reminders: boolean;
  promotions: boolean;
  statusUpdates: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  pushEnabled: true,
  reminders: true,
  promotions: false,
  statusUpdates: true,
};

interface ToggleItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function ToggleItem({ icon, iconColor, iconBg, label, description, value, onValueChange }: ToggleItemProps) {
  return (
    <View style={styles.toggleCard}>
      <View style={styles.toggleLeft}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>{label}</Text>
          <Text style={styles.toggleDesc}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.neutral200, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.neutral500}
      />
    </View>
  );
}

export function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults
    }
  };

  const updatePref = async (key: keyof NotificationPrefs, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch {
      // Silently fail
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>NOTIFICACIONES</Text>

      <ToggleItem
        icon="notifications"
        iconColor="#F59E0B"
        iconBg="#FFFBEB"
        label="Notificaciones push"
        description="Recibir notificaciones en tu dispositivo"
        value={prefs.pushEnabled}
        onValueChange={(v) => updatePref('pushEnabled', v)}
      />

      <ToggleItem
        icon="alarm"
        iconColor={colors.primary}
        iconBg={colors.primaryLight}
        label="Recordatorios de citas"
        description="Recordatorios antes de tus citas programadas"
        value={prefs.reminders}
        onValueChange={(v) => updatePref('reminders', v)}
      />

      <ToggleItem
        icon="local-offer"
        iconColor="#22C55E"
        iconBg="#F0FDF4"
        label="Promociones y ofertas"
        description="Ofertas especiales de proveedores de servicios"
        value={prefs.promotions}
        onValueChange={(v) => updatePref('promotions', v)}
      />

      <ToggleItem
        icon="sync"
        iconColor="#3B82F6"
        iconBg="#EFF6FF"
        label="Actualizaciones de estado"
        description="Cambios en el estado de tus reservas"
        value={prefs.statusUpdates}
        onValueChange={(v) => updatePref('statusUpdates', v)}
      />

      <Text style={styles.footerText}>
        Puedes cambiar estas preferencias en cualquier momento. Las notificaciones push tambien se pueden configurar desde los ajustes de tu dispositivo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
  },
  content: {
    ...screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.ms,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.neutral900,
  },
  toggleDesc: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
    marginTop: 2,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
});
