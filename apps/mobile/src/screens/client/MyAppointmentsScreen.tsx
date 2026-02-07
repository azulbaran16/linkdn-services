import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiGet, apiPost } from '../../lib/api';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorMessage } from '../../components/ErrorMessage';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows, screenPadding } from '../../theme';
import { AppointmentsStackParamList } from '../../navigation/MainTabs';

type TabKey = 'upcoming' | 'history';

interface BookingData {
  id: string;
  clientName: string;
  clientEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  service: { name: string; durationMinutes: number; priceFrom: number | null };
  workspace: {
    profile: { displayName: string; contactEmail: string; contactPhone: string } | null;
  };
  token: { token: string } | null;
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'Confirmado', color: colors.success, bgColor: colors.successLight, icon: 'check-circle' as const };
    case 'CANCELLED':
      return { label: 'Cancelado', color: colors.danger, bgColor: colors.dangerLight, icon: 'cancel' as const };
    case 'RESCHEDULED':
      return { label: 'Reprogramado', color: colors.warning, bgColor: colors.warningLight, icon: 'schedule' as const };
    default:
      return { label: status, color: colors.neutral500, bgColor: colors.neutral100, icon: 'help' as const };
  }
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

  if (date >= today && date < tomorrow) return 'HOY';
  if (date >= tomorrow && date < dayAfterTomorrow) return 'MANANA';
  if (date < endOfWeek) return 'ESTA SEMANA';
  if (date < endOfNextWeek) return 'PROXIMA SEMANA';
  return 'MAS ADELANTE';
}

function formatBookingDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatBookingTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function BookingCard({ booking, onRefetch }: { booking: BookingData; onRefetch: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<AppointmentsStackParamList>>();
  const statusConfig = getStatusConfig(booking.status);
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => apiPost(`/api/bookings/${booking.token?.token}/cancel`, {}, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      onRefetch();
    },
  });

  const handleContact = () => {
    const phone = booking.workspace.profile?.contactPhone;
    const email = booking.workspace.profile?.contactEmail;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert('Sin contacto', 'No hay informacion de contacto disponible para este proveedor.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar reserva',
      'Estas seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, cancelar',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ]
    );
  };

  const handleViewDetails = () => {
    if (booking.token?.token) {
      navigation.navigate('ManageBooking', { token: booking.token.token });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.thumbnail} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardServiceName}>{booking.service.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <MaterialIcons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
          <View style={styles.dateRow}>
            <MaterialIcons name="calendar-today" size={14} color={colors.neutral500} />
            <Text style={styles.dateText}>
              {formatBookingDate(booking.startTime)} {'\u2022'} {formatBookingTime(booking.startTime)}
            </Text>
          </View>
          {booking.workspace.profile && (
            <View style={styles.dateRow}>
              <MaterialIcons name="store" size={14} color={colors.neutral500} />
              <Text style={styles.dateText}>{booking.workspace.profile.displayName}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardActions}>
        {booking.status === 'CONFIRMED' && (
          <>
            <Pressable style={styles.btnNeutral} onPress={handleCancel}>
              <Text style={styles.btnNeutralText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={handleContact}>
              <MaterialIcons name="chat" size={16} color={colors.primary} />
              <Text style={styles.btnSecondaryText}>Contactar</Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={handleViewDetails}>
              <Text style={styles.btnPrimaryText}>Ver detalles</Text>
            </Pressable>
          </>
        )}
      </View>

      {booking.status === 'CONFIRMED' && booking.token?.token && (
        <>
          <View style={styles.cardDivider} />
          <Pressable style={styles.btnRescheduleFullWidth} onPress={handleViewDetails}>
            <MaterialIcons name="edit-calendar" size={16} color={colors.primary} />
            <Text style={styles.btnSecondaryText}>Reagendar</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function UpcomingTab({ bookings, onRefetch }: { bookings: BookingData[]; onRefetch: () => void }) {
  const grouped = useMemo(() => {
    const groups: Record<string, BookingData[]> = {};
    const sortedBookings = [...bookings].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    for (const booking of sortedBookings) {
      const group = getDateGroup(booking.startTime);
      if (!groups[group]) groups[group] = [];
      groups[group].push(booking);
    }
    return groups;
  }, [bookings]);

  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="event" size={32} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Sin citas proximas</Text>
        <Text style={styles.emptyDesc}>
          Cuando reserves un servicio, tus citas apareceran aqui.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {Object.entries(grouped).map(([group, items]) => (
        <React.Fragment key={group}>
          <Text style={styles.sectionHeader}>{group}</Text>
          {items.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onRefetch={onRefetch} />
          ))}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

function HistoryTab({ bookings }: { bookings: BookingData[] }) {
  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="event" size={32} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Sin historial</Text>
        <Text style={styles.emptyDesc}>
          Tu historial de citas pasadas aparecera aqui.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} onRefetch={() => {}} />
      ))}
    </ScrollView>
  );
}

export function MyAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => apiGet<{ upcoming: BookingData[]; history: BookingData[] }>('/api/bookings/my'),
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'upcoming', label: 'Proximas' },
    { key: 'history', label: 'Historial' },
  ];

  if (isLoading) return <LoadingScreen />;
  if (error) return <View style={styles.container}><ErrorMessage message="Error al cargar citas" /></View>;

  const upcoming = data?.upcoming || [];
  const history = data?.history || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerIconBtn} />
        <Text style={styles.headerTitle}>Mis Reservas</Text>
        <View style={styles.headerIconBtn} />
      </View>

      {/* Tab Row */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'upcoming' && <UpcomingTab bookings={upcoming} onRefetch={refetch} />}
      {activeTab === 'history' && <HistoryTab bookings={history} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, paddingHorizontal: screenPadding.paddingHorizontal, paddingBottom: spacing.sm },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.neutral900, textAlign: 'center', flex: 1 },
  tabRow: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.neutral200 },
  tab: { flex: 1, paddingVertical: spacing.ms, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.neutral500 },
  tabTextActive: { color: colors.neutral900, fontWeight: fontWeight.bold },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: screenPadding.paddingHorizontal, paddingBottom: spacing['2xl'] },
  sectionHeader: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.neutral500, letterSpacing: 1.2, marginTop: spacing.xl, marginBottom: spacing.ms },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.neutral200, padding: spacing.ms, marginBottom: spacing.ms, ...shadows.card },
  cardTopRow: { flexDirection: 'row', gap: spacing.ms },
  thumbnail: { width: 70, height: 70, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight },
  cardInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  cardServiceName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral900 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateText: { fontSize: fontSize.sm, color: colors.neutral500 },
  cardDivider: { height: 1, backgroundColor: colors.neutral200, marginVertical: spacing.ms },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  btnPrimaryText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.white },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  btnSecondaryText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  btnNeutral: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.neutral100, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  btnNeutralText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.neutral900 },
  btnRescheduleFullWidth: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primaryLight, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'] },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.neutral900, marginBottom: spacing.sm },
  emptyDesc: { fontSize: fontSize.sm, color: colors.neutral500, textAlign: 'center', lineHeight: 20 },
});
