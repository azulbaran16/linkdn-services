import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { colors, fontSize, fontWeight, spacing, borderRadius, screenPadding, shadows } from '../theme';
import { ProfileStackParamList } from '../navigation/MainTabs';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.105:3000';

type ProfileMenuItemProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  onPress?: () => void;
  labelColor?: string;
  showChevron?: boolean;
};

function ProfileMenuItem({
  icon,
  iconColor,
  iconBg,
  label,
  onPress,
  labelColor = colors.neutral900,
  showChevron = true,
}: ProfileMenuItemProps) {
  return (
    <Pressable style={styles.menuItemCard} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconCircle, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={[styles.menuLabel, { color: labelColor }]}>{label}</Text>
      </View>
      {showChevron && (
        <MaterialIcons name="chevron-right" size={24} color={colors.neutral500} />
      )}
    </Pressable>
  );
}

export function ProfileTabScreen() {
  const { user, logout } = useAuth();
  const { role, switchRole } = useRole();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const otherRole = role === 'provider' ? 'Cliente' : 'Proveedor';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.editOverlay}>
            <MaterialIcons name="edit" size={18} color={colors.white} />
          </View>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.memberSince}>Miembro desde Enero 2024</Text>
      </View>

      {/* GENERAL Section */}
      <Text style={styles.sectionTitle}>GENERAL</Text>

      <ProfileMenuItem
        icon="person"
        iconColor={colors.primary}
        iconBg={colors.primaryLight}
        label="Editar perfil"
        onPress={() => navigation.navigate('EditProfile')}
      />
      <ProfileMenuItem
        icon="credit-card"
        iconColor="#3B82F6"
        iconBg="#EFF6FF"
        label="Metodos de pago"
        onPress={() => navigation.navigate('PaymentHistory')}
      />
      <ProfileMenuItem
        icon="notifications"
        iconColor="#F59E0B"
        iconBg="#FFFBEB"
        label="Notificaciones"
        onPress={() => navigation.navigate('NotificationSettings')}
      />
      <ProfileMenuItem
        icon="swap-horiz"
        iconColor="#22C55E"
        iconBg="#F0FDF4"
        label={`Cambiar a ${otherRole}`}
        onPress={switchRole}
      />

      {/* SOPORTE Y MAS Section */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>SOPORTE Y MAS</Text>

      <ProfileMenuItem
        icon="help"
        iconColor="#3B82F6"
        iconBg="#EFF6FF"
        label="Centro de ayuda"
        onPress={() => Linking.openURL('mailto:soporte@linkdn.co')}
      />
      <ProfileMenuItem
        icon="shield"
        iconColor={colors.neutral500}
        iconBg={colors.neutral100}
        label="Politica de privacidad"
        onPress={() => Linking.openURL(`${API_URL}/privacy`)}
      />
      <ProfileMenuItem
        icon="description"
        iconColor={colors.neutral500}
        iconBg={colors.neutral100}
        label="Terminos de servicio"
        onPress={() => Linking.openURL(`${API_URL}/terms`)}
      />

      {/* Logout */}
      <ProfileMenuItem
        icon="logout"
        iconColor={colors.danger}
        iconBg={colors.dangerLight}
        label="Cerrar sesion"
        labelColor={colors.danger}
        showChevron={false}
        onPress={logout}
      />

      {/* Version Footer */}
      <Text style={styles.version}>LinkDN Services v0.1.0</Text>
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
    paddingBottom: spacing['3xl'],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    width: 128,
    height: 128,
    marginBottom: spacing.ms,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
  },
  memberSince: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    marginTop: spacing.xs,
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
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.ms,
  },
  menuLabel: {
    fontSize: fontSize.md,
    color: colors.neutral900,
  },
  version: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
  },
});
