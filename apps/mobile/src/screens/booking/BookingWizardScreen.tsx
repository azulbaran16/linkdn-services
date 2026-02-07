import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { MaterialIcons } from '@expo/vector-icons';
import { apiGet, apiPost } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  screenPadding,
} from '../../theme';
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

function getDayName(date: Date): string {
  const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  return days[date.getDay()];
}

function formatDisplayDate(date: Date): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatSlotTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatCOP(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-CO')}`;
}

// --- Step Indicator ---

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  return (
    <View style={stepStyles.container}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View
            style={[
              stepStyles.dot,
              s < currentStep && stepStyles.dotCompleted,
              s === currentStep && stepStyles.dotActive,
              s > currentStep && stepStyles.dotPending,
            ]}
          >
            <Text
              style={[
                stepStyles.dotText,
                s <= currentStep ? stepStyles.dotTextActive : stepStyles.dotTextPending,
              ]}
            >
              {s}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <View
              style={[
                stepStyles.connector,
                s < currentStep ? stepStyles.connectorDone : stepStyles.connectorPending,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: colors.primary,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotPending: {
    backgroundColor: colors.neutral200,
  },
  dotText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  dotTextActive: {
    color: colors.white,
  },
  dotTextPending: {
    color: colors.neutral500,
  },
  connector: {
    height: 2,
    width: 32,
    marginHorizontal: spacing.xs,
  },
  connectorDone: {
    backgroundColor: colors.primary,
  },
  connectorPending: {
    backgroundColor: colors.neutral200,
  },
});

// --- Main Screen ---

export function BookingWizardScreen({ navigation, route }: Props) {
  const { slug, serviceId, serviceName, priceFrom: rawPriceFrom } = route.params;
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    serviceName: string;
    providerName: string;
    startTime: string;
    endTime: string;
    manageToken: string;
  } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const days = useMemo(() => getNext14Days(), []);

  // priceFrom comes as string from Prisma Decimal — convert to number (COP pesos, not centavos)
  const priceFrom = rawPriceFrom != null ? Number(rawPriceFrom) : 0;

  // Whether we have price info to show payment step
  const hasPrice = priceFrom > 0;
  const totalSteps = hasPrice ? 4 : 3;

  // Deposit calculation (30% of service price in COP pesos)
  const depositAmount = hasPrice ? Math.round(priceFrom * 0.3) : 0;
  const remainingAmount = hasPrice ? priceFrom - depositAmount : 0;

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

  // Form for client info (step 3) — pre-fill with user data
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      clientName: user?.name || '',
      clientEmail: user?.email || '',
      clientPhone: user?.phone || '',
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const onSubmitBooking = async (data: { clientName: string; clientEmail: string; clientPhone: string }) => {
    setError('');
    if (!selectedSlot) {
      setError('Selecciona un horario');
      return;
    }
    if (!data.clientName.trim()) {
      setError('Tu nombre es requerido');
      return;
    }
    if (!data.clientEmail.trim()) {
      setError('Tu correo es requerido');
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiPost<any>('/api/bookings', {
        serviceId,
        slug,
        startTime: selectedSlot.startTime,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone || '',
      }, false);

      const result = {
        bookingId: response.booking.id,
        serviceName: response.booking.serviceName,
        providerName: response.booking.providerName,
        startTime: response.booking.startTime,
        endTime: response.booking.endTime,
        manageToken: response.manageToken,
      };

      if (hasPrice) {
        // Go to step 4 (payment)
        setBookingResult(result);
        setStep(4);
      } else {
        // No price, go directly to confirmation
        navigation.replace('BookingConfirmation', result);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!bookingResult) return;
    setPaymentLoading(true);
    setError('');
    try {
      const response = await apiPost<{ paymentUrl: string; reference: string }>('/api/payments/create', {
        bookingId: bookingResult.bookingId,
      });

      if (response.paymentUrl === '__SANDBOX_APPROVED__') {
        // Dev mode: payment auto-approved, go straight to confirmation
        navigation.replace('BookingConfirmation', bookingResult);
      } else {
        navigation.replace('PaymentWebView', {
          paymentUrl: response.paymentUrl,
          bookingId: bookingResult.bookingId,
          manageToken: bookingResult.manageToken,
          serviceName: bookingResult.serviceName,
          providerName: bookingResult.providerName,
          startTime: bookingResult.startTime,
          endTime: bookingResult.endTime,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el pago');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSkipPayment = () => {
    if (!bookingResult) return;
    navigation.replace('BookingConfirmation', bookingResult);
  };

  // --- Step labels ---
  const stepLabels = hasPrice
    ? ['Fecha', 'Horario', 'Confirmar', 'Pago']
    : ['Fecha', 'Horario', 'Confirmar'];

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={totalSteps} />
        <Text style={styles.stepLabel}>{stepLabels[step - 1]}</Text>

        {error ? <ErrorMessage message={error} /> : null}

        {/* Step 1: Select Date */}
        {step >= 1 && step <= 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={days}
              keyExtractor={(item) => formatDate(item)}
              contentContainerStyle={styles.datesContainer}
              renderItem={({ item }) => {
                const isSelected = selectedDate ? formatDate(selectedDate) === formatDate(item) : false;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDate(item);
                      setSelectedSlot(null);
                      if (step < 2) setStep(2);
                    }}
                    style={[
                      styles.dateCircle,
                      isSelected && styles.dateCircleSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dateDayName,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {getDayName(item)}
                    </Text>
                    <Text
                      style={[
                        styles.dateDayNumber,
                        isSelected && styles.dateTextSelected,
                      ]}
                    >
                      {item.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Step 2: Select Time Slot */}
        {step >= 2 && step <= 3 && selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecciona un horario</Text>
            <Text style={styles.sectionSubtitle}>
              {formatDisplayDate(selectedDate)}
            </Text>
            {slotsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando horarios...</Text>
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hay horarios disponibles para esta fecha.
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <TouchableOpacity
                      key={slot.startTime}
                      onPress={() => {
                        setSelectedSlot(slot);
                        if (step < 3) setStep(3);
                      }}
                      style={[
                        styles.slotPill,
                        isSelected && styles.slotPillSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.slotPillText,
                          isSelected && styles.slotPillTextSelected,
                        ]}
                      >
                        {formatSlotTime(slot.startTime)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Step 3: Client Info + Confirm */}
        {step === 3 && selectedSlot && (
          <View style={styles.section}>
            {/* Summary card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen de la reserva</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Servicio</Text>
                <Text style={styles.summaryValue}>{serviceName}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fecha</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate ? formatDisplayDate(selectedDate) : ''}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hora</Text>
                <Text style={styles.summaryValue}>
                  {formatSlotTime(selectedSlot.startTime)}
                </Text>
              </View>
              {hasPrice && (
                <>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Precio</Text>
                    <Text style={styles.summaryValue}>{formatCOP(priceFrom!)}</Text>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.sectionTitle}>Tus datos</Text>

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

            <Button
              title="Confirmar reserva"
              onPress={handleSubmit(onSubmitBooking)}
              loading={submitting}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}

        {/* Step 4: Payment */}
        {step === 4 && bookingResult && hasPrice && (
          <View style={styles.section}>
            {/* Payment summary card */}
            <View style={styles.paymentCard}>
              <View style={styles.paymentIconRow}>
                <View style={styles.paymentIconCircle}>
                  <MaterialIcons name="payment" size={28} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.paymentTitle}>Reserva confirmada!</Text>
              <Text style={styles.paymentSubtitle}>
                Puedes asegurar tu cita pagando el deposito ahora.
              </Text>
            </View>

            {/* Price breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Desglose del pago</Text>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Precio total del servicio</Text>
                <Text style={styles.breakdownValue}>{formatCOP(priceFrom!)}</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelRow}>
                  <MaterialIcons name="lock" size={14} color={colors.primary} />
                  <Text style={[styles.breakdownLabel, { color: colors.primary, fontWeight: fontWeight.semibold }]}>
                    Deposito (30%)
                  </Text>
                </View>
                <Text style={[styles.breakdownValue, { color: colors.primary, fontWeight: fontWeight.bold }]}>
                  {formatCOP(depositAmount)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Pago al proveedor (70%)</Text>
                <Text style={styles.breakdownValue}>{formatCOP(remainingAmount)}</Text>
              </View>

              <View style={styles.breakdownNote}>
                <MaterialIcons name="info-outline" size={14} color={colors.neutral500} />
                <Text style={styles.breakdownNoteText}>
                  El 70% restante se paga directamente al proveedor al momento del servicio.
                </Text>
              </View>
            </View>

            {/* Payment methods info */}
            <View style={styles.methodsRow}>
              <MaterialIcons name="credit-card" size={18} color={colors.neutral500} />
              <MaterialIcons name="account-balance" size={18} color={colors.neutral500} />
              <MaterialIcons name="phone-android" size={18} color={colors.neutral500} />
              <Text style={styles.methodsText}>Tarjeta, PSE o Nequi</Text>
            </View>

            <Button
              title={`Pagar deposito ${formatCOP(depositAmount)}`}
              onPress={handlePayDeposit}
              loading={paymentLoading}
              style={{ marginTop: spacing.md }}
            />

            <Button
              title="Pagar despues"
              onPress={handleSkipPayment}
              variant="ghost"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom service bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <Text style={styles.bottomBarService} numberOfLines={1}>
            {serviceName}
          </Text>
        </View>
      </View>
    </View>
  );
}

const SLOT_GAP = spacing.sm;
const SLOT_COLUMNS = 3;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.neutral100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    ...screenPadding,
    paddingBottom: 100, // space for bottom bar
  },
  stepLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral500,
    marginBottom: spacing.ms,
  },

  // --- Date selector ---
  datesContainer: {
    paddingVertical: spacing.sm,
    gap: spacing.ms,
  },
  dateCircle: {
    width: 60,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDayName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.neutral500,
    marginBottom: 2,
  },
  dateDayNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
  },
  dateTextSelected: {
    color: colors.white,
  },

  // --- Time slots ---
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SLOT_GAP,
  },
  slotPill: {
    width: `${(100 - ((SLOT_COLUMNS - 1) * SLOT_GAP) / 3) / SLOT_COLUMNS}%` as any,
    flexGrow: 1,
    flexBasis: '30%',
    paddingVertical: spacing.ms,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotPillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral900,
  },
  slotPillTextSelected: {
    color: colors.white,
  },

  // --- Loading / empty ---
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
    textAlign: 'center',
  },

  // --- Summary card (step 3) ---
  summaryCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.ms,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral500,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.neutral200,
    marginVertical: spacing.xs,
  },

  // --- Payment step (step 4) ---
  paymentCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  paymentIconRow: {
    marginBottom: spacing.ms,
  },
  paymentIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.xs,
  },
  paymentSubtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
    textAlign: 'center',
    lineHeight: 20,
  },
  breakdownCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral200,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  breakdownTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.ms,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  breakdownLabel: {
    fontSize: fontSize.sm,
    color: colors.neutral700,
  },
  breakdownValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
  },
  breakdownNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.ms,
    padding: spacing.sm,
    backgroundColor: colors.neutral100,
    borderRadius: borderRadius.sm,
  },
  breakdownNoteText: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
    flex: 1,
    lineHeight: 18,
  },
  methodsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  methodsText: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
  },

  // --- Fixed bottom bar ---
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    paddingVertical: spacing.ms,
    ...screenPadding,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarService: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
  },
});
