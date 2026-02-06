import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createServiceSchema, CreateServiceInput } from 'shared';
import { apiGet, apiPost, apiPut } from '../../lib/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LoadingScreen } from '../../components/LoadingScreen';
import { colors, spacing } from '../../theme';
import { ProviderStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ProviderStackParamList, 'ServiceEditor'>;

export function ServiceEditorScreen({ navigation, route }: Props) {
  const { serviceId } = route.params || {};
  const isEditing = !!serviceId;
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  // Fetch existing service for editing
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiGet<{ services: any[] }>('/api/services'),
    enabled: isEditing,
  });

  const existingService = servicesData?.services?.find((s: any) => s.id === serviceId);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: '',
      description: '',
      durationMinutes: 60,
      bufferMinutesBefore: 0,
      bufferMinutesAfter: 0,
      priceFrom: undefined,
    },
  });

  useEffect(() => {
    if (existingService) {
      reset({
        name: existingService.name,
        description: existingService.description || '',
        durationMinutes: existingService.durationMinutes,
        bufferMinutesBefore: existingService.bufferMinutesBefore || 0,
        bufferMinutesAfter: existingService.bufferMinutesAfter || 0,
        priceFrom: existingService.priceFrom ? Number(existingService.priceFrom) : undefined,
      });
    }
  }, [existingService, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceInput) => apiPost('/api/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      Alert.alert('Servicio creado', 'El servicio ha sido creado exitosamente.');
      navigation.goBack();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateServiceInput) => apiPut(`/api/services/${serviceId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      Alert.alert('Servicio actualizado', 'El servicio ha sido actualizado.');
      navigation.goBack();
    },
  });

  const onSubmit = async (data: CreateServiceInput) => {
    setError('');
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el servicio');
    }
  };

  if (isEditing && isLoading) return <LoadingScreen />;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {error ? <ErrorMessage message={error} /> : null}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre del servicio"
              placeholder="Ej: Corte de cabello"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Descripcion (opcional)"
              placeholder="Describe el servicio..."
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
              error={errors.description?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="durationMinutes"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Duracion (minutos)"
              placeholder="60"
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(parseInt(text) || 0)}
              keyboardType="numeric"
              error={errors.durationMinutes?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="bufferMinutesBefore"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Tiempo de preparacion antes (minutos)"
              placeholder="0"
              value={value?.toString() || '0'}
              onChangeText={(text) => onChange(parseInt(text) || 0)}
              keyboardType="numeric"
              error={errors.bufferMinutesBefore?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="bufferMinutesAfter"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Tiempo de descanso despues (minutos)"
              placeholder="0"
              value={value?.toString() || '0'}
              onChangeText={(text) => onChange(parseInt(text) || 0)}
              keyboardType="numeric"
              error={errors.bufferMinutesAfter?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="priceFrom"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Precio desde (COP, opcional)"
              placeholder="50000"
              value={value?.toString() || ''}
              onChangeText={(text) => {
                const num = parseInt(text);
                onChange(isNaN(num) ? undefined : num);
              }}
              keyboardType="numeric"
              error={errors.priceFrom?.message}
            />
          )}
        />

        <Button
          title={isEditing ? 'Actualizar servicio' : 'Crear servicio'}
          onPress={handleSubmit(onSubmit)}
          loading={isSaving}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
});
