import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { apiGet } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingScreen } from '../../components/LoadingScreen';
import { colors, fontSize, spacing, borderRadius } from '../../theme';
import { ProviderStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ProviderStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const { data: workspaceData, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: () => apiGet<{ workspace: any }>('/api/workspaces/current').catch(() => null),
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiGet<{ services: any[] }>('/api/services').catch(() => ({ services: [] })),
    enabled: !!workspaceData?.workspace,
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['availability'],
    queryFn: () => apiGet<{ rules: any[] }>('/api/availability').catch(() => ({ rules: [] })),
    enabled: !!workspaceData?.workspace,
  });

  if (wsLoading) return <LoadingScreen />;

  const workspace = workspaceData?.workspace;
  const hasWorkspace = !!workspace;
  const hasProfile = !!workspace?.profile;
  const serviceCount = servicesData?.services?.length || 0;
  const hasAvailability = (availabilityData?.rules?.length || 0) > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hola, {user?.name}</Text>

      {!hasWorkspace && (
        <Card>
          <Text style={styles.cardTitle}>Crea tu espacio de trabajo</Text>
          <Text style={styles.cardDesc}>
            Configura tu perfil profesional para aparecer en el marketplace.
          </Text>
          <Button
            title="Crear espacio de trabajo"
            onPress={() => navigation.navigate('ProfileEditor')}
          />
        </Card>
      )}

      {hasWorkspace && (
        <>
          {/* Status checklist */}
          <Card>
            <Text style={styles.cardTitle}>Estado de tu perfil</Text>

            <StatusRow
              label="Perfil publico"
              done={hasProfile}
              onPress={() => navigation.navigate('ProfileEditor')}
            />
            <StatusRow
              label="Servicios"
              done={serviceCount > 0}
              detail={serviceCount > 0 ? `${serviceCount} servicio(s)` : undefined}
              onPress={() => navigation.navigate('ServicesList')}
            />
            <StatusRow
              label="Disponibilidad"
              done={hasAvailability}
              onPress={() => navigation.navigate('AvailabilityEditor')}
            />
          </Card>

          {/* Quick actions */}
          <Card>
            <Text style={styles.cardTitle}>Acciones rapidas</Text>
            <Button
              title="Editar perfil"
              onPress={() => navigation.navigate('ProfileEditor')}
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title="Gestionar servicios"
              onPress={() => navigation.navigate('ServicesList')}
              variant="outline"
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title="Configurar disponibilidad"
              onPress={() => navigation.navigate('AvailabilityEditor')}
              variant="outline"
            />
          </Card>
        </>
      )}

      <Button
        title="Cerrar sesion"
        onPress={logout}
        variant="secondary"
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

function StatusRow({
  label,
  done,
  detail,
  onPress,
}: {
  label: string;
  done: boolean;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.statusRow}>
      <View style={[styles.statusDot, done && styles.statusDotDone]} />
      <Text style={styles.statusLabel}>{label}</Text>
      {detail && <Text style={styles.statusDetail}>{detail}</Text>}
      <Text style={styles.statusArrow}>{'>'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },
  statusDotDone: {
    backgroundColor: colors.success,
  },
  statusLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  statusDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  statusArrow: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
