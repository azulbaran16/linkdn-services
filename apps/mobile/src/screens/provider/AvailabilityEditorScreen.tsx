import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '../../lib/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorMessage } from '../../components/ErrorMessage';
import { colors, fontSize, spacing, borderRadius } from '../../theme';
import { ProviderStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ProviderStackParamList, 'AvailabilityEditor'>;

const DAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mie' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sab' },
];

interface Rule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function AvailabilityEditorScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['availability'],
    queryFn: () => apiGet<{ rules: Rule[] }>('/api/availability'),
  });

  useEffect(() => {
    if (data?.rules) {
      setRules(data.rules.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      })));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (rules: Rule[]) => apiPut('/api/availability', { rules }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      Alert.alert('Disponibilidad guardada', 'Tu horario ha sido actualizado.');
      navigation.goBack();
    },
  });

  const toggleDay = (dayOfWeek: number) => {
    const existing = rules.filter((r) => r.dayOfWeek === dayOfWeek);
    if (existing.length > 0) {
      // Remove all rules for this day
      setRules(rules.filter((r) => r.dayOfWeek !== dayOfWeek));
    } else {
      // Add default rule for this day
      setRules([...rules, { dayOfWeek, startTime: '09:00', endTime: '17:00' }]);
    }
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setRules([...rules, { dayOfWeek, startTime: '09:00', endTime: '12:00' }]);
  };

  const updateRule = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError('');
    try {
      await mutation.mutateAsync(rules);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la disponibilidad');
    }
  };

  if (isLoading) return <LoadingScreen />;

  // Group rules by day
  const activeDays = new Set(rules.map((r) => r.dayOfWeek));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {error ? <ErrorMessage message={error} /> : null}

        <Text style={styles.instructions}>
          Selecciona los dias y horarios en los que estas disponible para atender.
        </Text>

        {/* Day toggles */}
        <View style={styles.daysRow}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day.value}
              onPress={() => toggleDay(day.value)}
              style={[
                styles.dayChip,
                activeDays.has(day.value) && styles.dayChipActive,
              ]}
            >
              <Text
                style={[
                  styles.dayChipText,
                  activeDays.has(day.value) && styles.dayChipTextActive,
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rules per day */}
        {DAYS.filter((d) => activeDays.has(d.value)).map((day) => {
          const dayRules = rules
            .map((r, idx) => ({ ...r, originalIndex: idx }))
            .filter((r) => r.dayOfWeek === day.value);

          return (
            <Card key={day.value}>
              <Text style={styles.dayTitle}>
                {['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][day.value]}
              </Text>

              {dayRules.map((rule) => (
                <View key={rule.originalIndex} style={styles.ruleRow}>
                  <View style={styles.timeInput}>
                    <Input
                      label="Desde"
                      placeholder="09:00"
                      value={rule.startTime}
                      onChangeText={(v) => updateRule(rule.originalIndex, 'startTime', v)}
                    />
                  </View>
                  <View style={styles.timeInput}>
                    <Input
                      label="Hasta"
                      placeholder="17:00"
                      value={rule.endTime}
                      onChangeText={(v) => updateRule(rule.originalIndex, 'endTime', v)}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => removeRule(rule.originalIndex)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => addTimeSlot(day.value)}
                style={styles.addSlotBtn}
              >
                <Text style={styles.addSlotText}>+ Agregar horario</Text>
              </TouchableOpacity>
            </Card>
          );
        })}

        <Button
          title="Guardar disponibilidad"
          onPress={handleSave}
          loading={mutation.isPending}
          style={{ marginTop: spacing.md }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  instructions: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
  dayChipTextActive: {
    color: colors.white,
  },
  dayTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  timeInput: {
    flex: 1,
  },
  removeBtn: {
    marginTop: 28,
    padding: spacing.sm,
  },
  removeText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  addSlotBtn: {
    paddingVertical: spacing.sm,
  },
  addSlotText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
});
