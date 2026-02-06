import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBookingSchema, CreateBookingInput } from 'shared';
import { apiGet, apiPost } from '../../lib/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorMessage } from '../../components/ErrorMessage';
import { colors, fontSize, spacing, borderRadius } from '../../theme';
import { MarketplaceStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'BookingWizard'>;

interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Generate next 14 days for date selection
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

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatSlotTime(isoString: string): string {
  const date = new Date(isoString);
  // Display in local time (will be Bogota time if device is configured correctly)
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function BookingWizardScreen({ navigation, route }: Props) {
  const { slug, serviceId, serviceName } = route.params;
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [error, setError] = useState('');

  const days = useMemo(() => getNext14Days(), []);

  // Compute date range for selected date
  const dateFrom = selectedDate ? new Date(selectedDate) : null;
  const dateTo = selectedDate
    ? new Date(new Date(selectedDate).setHours(23, 59, 59, 999))
    : null;

  // Fetch slots for selected date
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', slug, serviceId, selectedDate?.toISOString()],
    queryFn: () => {
      if (!dateFrom || !dateTo) return { slots: [] };
      const params = new URLSearchParams({
        slug,
        serviceId,
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      });
      return apiGet<{ slots: TimeSlot[] }>(`/api/slots?${params.toString()}`, false);
    },
    enabled: !!selectedDate,
  });

  const slots = slotsData?.slots || [];

  // Form for client info (step 3)
  const { control, handleSubmit, formState: { errors } } = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      serviceId,
      slug,
      startTime: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
    },
  });

  const bookingMutation = useMutation({
    mutationFn: (data: CreateBookingInput) => apiPost<any>('/api/bookings', data, false),
    onSuccess: (data) => {
      navigation.replace('BookingConfirmation', {
        bookingId: data.booking.id,
        serviceName: data.booking.serviceName,
        providerName: data.booking.providerName,
        startTime: data.booking.startTime,
        endTime: data.booking.endTime,
        manageToken: data.manageToken,
      });
    },
  });

  const onSubmitBooking = async (data: CreateBookingInput) => {
    setError('');
    if (!selectedSlot) {
      setError('Selecciona un horario');
      return;
    }
    try {
      await bookingMutation.mutateAsync({
        ...data,
        startTime: selectedSlot.startTime,
      });
    } catch (err: any) {
      setError(err.message || 'Error al crear la reserva');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Service info */}
        <Card>
          <Text style={styles.serviceName}>{serviceName}</Text>
          <Text style={styles.stepIndicator}>Paso {step} de 3</Text>
        </Card>

        {error ? <ErrorMessage message={error} /> : null}

        {/* Step 1: Select Date */}
        {step >= 1 && (
          <View>
            <Text style={styles.stepTitle}>1. Selecciona una fecha</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={days}
              keyExtractor={(item) => formatDate(item)}
              contentContainerStyle={styles.datesContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(item);
                    setSelectedSlot(null);
                    if (step < 2) setStep(2);
                  }}
                  style={[
                    styles.dateChip,
                    selectedDate && formatDate(selectedDate) === formatDate(item) && styles.dateChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      selectedDate && formatDate(selectedDate) === formatDate(item) && styles.dateChipTextSelected,
                    ]}
                  >
                    {formatDisplayDate(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Step 2: Select Time Slot */}
        {step >= 2 && selectedDate && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>2. Selecciona un horario</Text>
            {slotsLoading ? (
              <Text style={styles.loadingText}>Cargando horarios disponibles...</Text>
            ) : slots.length === 0 ? (
              <Text style={styles.noSlots}>No hay horarios disponibles para esta fecha.</Text>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((slot) => (
                  <TouchableOpacity
                    key={slot.startTime}
                    onPress={() => {
                      setSelectedSlot(slot);
                      if (step < 3) setStep(3);
                    }}
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
          </View>
        )}

        {/* Step 3: Client Info + Confirm */}
        {step >= 3 && selectedSlot && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>3. Tus datos</Text>

            <Controller
              control={control}
              name="clientName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Tu nombre"
                  placeholder="Nombre completo"
                  value={value}
                  onChangeText={onChange}
                  error={errors.clientName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="clientEmail"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Correo electronico"
                  placeholder="tu@correo.com"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.clientEmail?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="clientPhone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Telefono (opcional)"
                  placeholder="300 123 4567"
                  value={value || ''}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  error={errors.clientPhone?.message}
                />
              )}
            />

            {/* Confirmation summary */}
            <Card style={{ backgroundColor: colors.background }}>
              <Text style={styles.summaryTitle}>Resumen de la reserva</Text>
              <Text style={styles.summaryRow}>Servicio: {serviceName}</Text>
              <Text style={styles.summaryRow}>
                Fecha: {selectedDate ? formatDisplayDate(selectedDate) : ''}
              </Text>
              <Text style={styles.summaryRow}>
                Hora: {formatSlotTime(selectedSlot.startTime)}
              </Text>
            </Card>

            <Button
              title="Confirmar reserva"
              onPress={handleSubmit(onSubmitBooking)}
              loading={bookingMutation.isPending}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  serviceName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  stepIndicator: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  stepTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.sm,
  },
  datesContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  dateChipTextSelected: {
    color: colors.white,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  noSlots: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  slotChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  slotChipTextSelected: {
    color: colors.white,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
