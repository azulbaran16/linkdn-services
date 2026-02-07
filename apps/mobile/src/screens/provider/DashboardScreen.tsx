import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { apiGet } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingScreen } from '../../components/LoadingScreen';
import { colors, fontSize, fontWeight, spacing, borderRadius, screenPadding } from '../../theme';
import { ProviderStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ProviderStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

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

  const completedSteps = [hasWorkspace, hasProfile, serviceCount > 0, hasAvailability].filter(Boolean).length;
  const totalSteps = 4;
  const progress = completedSteps / totalSteps;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.greeting}>Hola, {user?.name}</Text>
      <Text style={styles.subGreeting}>Gestiona tu negocio</Text>

      {!hasWorkspace ? (
        <Card style={styles.setupCard}>
          <View style={styles.setupIconCircle}>
            <Text style={styles.setupIcon}>+</Text>
          </View>
          <Text style={styles.setupTitle}>Crea tu espacio de trabajo</Text>
          <Text style={styles.setupDesc}>
            Configura tu perfil profesional para aparecer en el marketplace.
          </Text>
          <Button
            title="Comenzar"
            onPress={() => navigation.navigate('ProfileEditor')}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : (
        <>
          {progress < 1 && (
            <Card style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Configuracion</Text>
                <Badge
                  label={`${completedSteps}/${totalSteps}`}
                  variant={progress === 1 ? 'success' : 'primary'}
                />
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressHint}>
                Completa tu perfil para empezar a recibir reservas
              </Text>
            </Card>
          )}

          <Text style={styles.sectionTitle}>Tu perfil</Text>

          <SetupRow
            label="Perfil publico"
            done={hasProfile}
            detail={hasProfile ? 'Configurado' : 'Pendiente'}
            onPress={() => navigation.navigate('ProfileEditor')}
          />
          <SetupRow
            label="Servicios"
            done={serviceCount > 0}
            detail={serviceCount > 0 ? `${serviceCount} servicio(s)` : 'Sin servicios'}
            onPress={() => navigation.navigate('ServicesList')}
          />
          <SetupRow
            label="Disponibilidad"
            done={hasAvailability}
            detail={hasAvailability ? 'Configurada' : 'Pendiente'}
            onPress={() => navigation.navigate('AvailabilityEditor')}
          />

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Acciones rapidas</Text>

          <View style={styles.quickActions}>
            <QuickAction
              label="Clientes"
              onPress={() => navigation.navigate('ClientsList' as any)}
            />
            <QuickAction
              label="Notificaciones"
              onPress={() => navigation.navigate('Notifications' as any)}
            />
            <QuickAction
              label="Servicios"
              onPress={() => navigation.navigate('ServicesList')}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SetupRow({
  label,
  done,
  detail,
  onPress,
}: {
  label: string;
  done: boolean;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.setupRow}>
      <View style={styles.setupRowLeft}>
        <View style={[styles.dot, done && styles.dotDone]} />
        <View>
          <Text style={styles.setupRowLabel}>{label}</Text>
          <Text style={styles.setupRowDetail}>{detail}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>{'>'}</Text>
    </Card>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral100 },
  content: { ...screenPadding, paddingBottom: spacing['3xl'] },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
  },
  subGreeting: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  setupCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  setupIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  setupIcon: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  setupTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
  },
  setupDesc: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressCard: {
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.ms,
  },
  progressTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.neutral200,
    borderRadius: 3,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressHint: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.ms,
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.ms,
  },
  setupRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral200,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  setupRowLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.neutral900,
  },
  setupRowDetail: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
    marginTop: 2,
  },
  arrow: {
    fontSize: fontSize.md,
    color: colors.neutral500,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
});
