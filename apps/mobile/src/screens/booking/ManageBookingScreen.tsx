import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorMessage } from '../../components/ErrorMessage';
import { colors, fontSize, fontWeight, spacing, borderRadius, screenPadding } from '../../theme';
import { Badge } from '../../components/Badge';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageBooking'>;

interface BookingDetails {
  id: string;
  serviceName: string;
  durationMinutes: number;
  providerName: string;
  providerSlug: string;
  clientName: string;
  clientEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  cancelledAt: string | null;
  rescheduledAt: string | null;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatShortDate(date: Date): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatSlotTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function ManageBookingScreen({ route }: Props) {
  const { token } = route.params;
  const queryClient = useQueryClient();
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [error, setError] = useState('');

  const days = useMemo(() => getNext14Days(), []);

  // Fetch booking details
  const { data, isLoading } = useQuery({
    queryKey: ['booking', token],
    queryFn: () => apiGet<{ booking: BookingDetails }>(`/api/bookings/${token}`, false),
  });

  // Fetch slots for rescheduling
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['reschedule-slots', data?.booking?.providerSlug, token, selectedDate?.toISOString()],
    queryFn: () => {
      if (!data?.booking || !selectedDate) return { slots: [] };
      const dateTo = new Date(selectedDate);
      dateTo.setHours(23, 59, 59, 999);
      const params = new URLSearchParams({
        slug: data.booking.providerSlug,
        serviceId: '', // We'll need to get serviceId from a different source
        from: selectedDate.toISOString(),
        to: dateTo.toISOString(),
      });
      // Use the booking's details to get slots
      return apiGet<{ slots: TimeSlot[] }>(`/api/slots?slug=${data.booking.providerSlug}&serviceId=${data.booking.id}&from=${selectedDate.toISOString()}&to=${dateTo.toISOString()}`, false)
        .catch(() => ({ slots: [] }));
    },
    enabled: showReschedule && !!selectedDate && !!data?.booking,
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiPost(`/api/bookings/${token}/cancel`, {}, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', token] });
      Alert.alert('Reserva cancelada', 'Tu reserva ha sido cancelada exitosamente.');
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (newStartTime: string) =>
      apiPost(`/api/bookings/${token}/reschedule`, { newStartTime }, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', token] });
      setShowReschedule(false);
      setSelectedSlot(null);
      setSelectedDate(null);
      Alert.alert('Reserva reprogramada', 'Tu reserva ha sido reprogramada exitosamente.');
    },
  });

  const handleCancel = () => {
    Alert.alert(
      'Cancelar reserva',
      'Estas seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, cancelar',
          style: 'destructive',
          onPress: async () => {
            setError('');
            try {
              await cancelMutation.mutateAsync();
            } catch (err: any) {
              setError(err.message || 'Error al cancelar');
            }
          },
        },
      ]
    );
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setError('');
    try {
      await rescheduleMutation.mutateAsync(selectedSlot.startTime);
    } catch (err: any) {
      setError(err.message || 'Error al reprogramar');
    }
  };

  if (isLoading) return <LoadingScreen />;

  const booking = data?.booking;
  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ErrorMessage message="Reserva no encontrada o enlace invalido." />
        </View>
      </View>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';
  const statusText = isConfirmed
    ? 'Confirmada'
    : booking.status === 'CANCELLED'
    ? 'Cancelada'
    : 'Reprogramada';
  const statusVariant = isConfirmed ? 'success' : booking.status === 'CANCELLED' ? 'danger' : 'warning';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {error ? <ErrorMessage message={error} /> : null}

        <Card>
          <Text style={styles.sectionTitle}>Detalles de la reserva</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Servicio</Text>
            <Text style={styles.detailValue}>{booking.serviceName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Proveedor</Text>
            <Text style={styles.detailValue}>{booking.providerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha y hora</Text>
            <Text style={styles.detailValue}>{formatDateTime(booking.startTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cliente</Text>
            <Text style={styles.detailValue}>{booking.clientName}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Estado</Text>
            <Badge label={statusText} variant={statusVariant} />
          </View>
        </Card>

        {isConfirmed && !showReschedule && (
          <View>
            <Button
              title="Reprogramar"
              onPress={() => setShowReschedule(true)}
              variant="outline"
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title="Cancelar reserva"
              onPress={handleCancel}
              variant="danger"
              loading={cancelMutation.isPending}
            />
          </View>
        )}

        {/* Reschedule flow */}
        {showReschedule && (
          <Card>
            <Text style={styles.sectionTitle}>Reprogramar</Text>
            <Text style={styles.rescheduleInstructions}>
              Selecciona nueva fecha y horario:
            </Text>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={days}
              keyExtractor={(item) => item.toISOString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(item);
                    setSelectedSlot(null);
                  }}
                  style={[
                    styles.dateChip,
                    selectedDate && selectedDate.toDateString() === item.toDateString() && styles.dateChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      selectedDate && selectedDate.toDateString() === item.toDateString() && styles.dateChipTextSelected,
                    ]}
                  >
                    {formatShortDate(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {selectedDate && slotsLoading && (
              <Text style={styles.loadingText}>Cargando horarios...</Text>
            )}

            {selectedDate && !slotsLoading && (slotsData?.slots || []).length === 0 && (
              <Text style={styles.noSlots}>No hay horarios disponibles para esta fecha.</Text>
            )}

            {selectedDate && (slotsData?.slots || []).length > 0 && (
              <View style={styles.slotsGrid}>
                {(slotsData?.slots || []).map((slot: TimeSlot) => (
                  <TouchableOpacity
                    key={slot.startTime}
                    onPress={() => setSelectedSlot(slot)}
                    style={[
                      styles.slotChip,
                      selectedSlot?.startTime === slot.startTime && styles.slotChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotChipText,
                        selectedSlot?.startTime === slot.startTime && styles.slotChipTextSelected,
                      ]}
                    >
                      {formatSlotTime(slot.startTime)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setShowReschedule(false);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Confirmar"
                onPress={handleReschedule}
                disabled={!selectedSlot}
                loading={rescheduleMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral100 },
  content: { ...screenPadding, paddingVertical: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    flex: 1,
    textAlign: 'right',
  },
  rescheduleInstructions: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
    marginBottom: spacing.sm,
  },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral200,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: fontSize.sm,
    color: colors.neutral900,
  },
  dateChipTextSelected: {
    color: colors.white,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  noSlots: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.ms,
  },
  slotChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral200,
    backgroundColor: colors.white,
  },
  slotChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotChipText: {
    fontSize: fontSize.sm,
    color: colors.neutral900,
  },
  slotChipTextSelected: {
    color: colors.white,
  },
});
