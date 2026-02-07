import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { apiGet } from '../lib/api';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorMessage } from '../components/ErrorMessage';
import { colors, fontSize, fontWeight, spacing, borderRadius, screenPadding, shadows } from '../theme';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  booking: {
    clientName: string;
    startTime: string;
    service: { name: string };
    workspace: {
      profile: { displayName: string } | null;
    };
  };
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Aprobado', color: colors.success, bgColor: colors.successLight, icon: 'check-circle' as const };
    case 'PENDING':
      return { label: 'Pendiente', color: colors.warning, bgColor: colors.warningLight, icon: 'schedule' as const };
    case 'DECLINED':
      return { label: 'Rechazado', color: colors.danger, bgColor: colors.dangerLight, icon: 'cancel' as const };
    case 'VOIDED':
      return { label: 'Anulado', color: colors.neutral500, bgColor: colors.neutral100, icon: 'block' as const };
    default:
      return { label: 'Error', color: colors.danger, bgColor: colors.dangerLight, icon: 'error' as const };
  }
}

function formatAmount(amountInCents: number): string {
  const amount = amountInCents / 100;
  return `$${amount.toLocaleString('es-CO')}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PaymentCard({ payment }: { payment: Payment }) {
  const statusConfig = getStatusConfig(payment.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{formatAmount(payment.amount)}</Text>
            <Text style={styles.currency}>{payment.currency}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <MaterialIcons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(payment.createdAt)}</Text>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="cleaning-services" size={16} color={colors.neutral500} />
          <Text style={styles.detailText}>{payment.booking.service.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="store" size={16} color={colors.neutral500} />
          <Text style={styles.detailText}>{payment.booking.workspace.profile?.displayName || 'Proveedor'}</Text>
        </View>
        {payment.paymentMethod && (
          <View style={styles.detailRow}>
            <MaterialIcons name="credit-card" size={16} color={colors.neutral500} />
            <Text style={styles.detailText}>{payment.paymentMethod}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function PaymentHistoryScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => apiGet<{ payments: Payment[] }>('/api/payments/my'),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <View style={styles.container}><ErrorMessage message="Error al cargar pagos" /></View>;

  const payments = data?.payments || [];

  if (payments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="receipt-long" size={32} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Sin pagos</Text>
        <Text style={styles.emptyDesc}>
          Cuando realices un pago por un servicio, aparecera aqui.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={payments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PaymentCard payment={item} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
  },
  listContent: {
    ...screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral200,
    padding: spacing.md,
    marginBottom: spacing.ms,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    gap: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  amount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
  },
  currency: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral500,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.neutral200,
    marginVertical: spacing.ms,
  },
  cardDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.neutral100,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
