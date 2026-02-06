import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiDelete } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingScreen } from '../../components/LoadingScreen';
import { colors, fontSize, spacing } from '../../theme';
import { ProviderStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ProviderStackParamList, 'ServicesList'>;

interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceFrom: number | null;
  active: boolean;
}

export function ServicesListScreen({ navigation }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiGet<{ services: Service[] }>('/api/services'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar servicio',
      `Estas seguro de que deseas eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;

  const services = data?.services || [];

  const renderService = ({ item }: { item: Service }) => (
    <Card>
      <TouchableOpacity
        onPress={() => navigation.navigate('ServiceEditor', { serviceId: item.id })}
      >
        <Text style={styles.serviceName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.serviceDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceDetail}>{item.durationMinutes} min</Text>
          {item.priceFrom !== null && (
            <Text style={styles.serviceDetail}>
              Desde ${Number(item.priceFrom).toLocaleString('es-CO')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDelete(item.id, item.name)}
        style={styles.deleteBtn}
      >
        <Text style={styles.deleteText}>Eliminar</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tienes servicios aun.</Text>
            <Text style={styles.emptySubtext}>
              Crea tu primer servicio para comenzar a recibir reservas.
            </Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <Button
          title="Agregar servicio"
          onPress={() => navigation.navigate('ServiceEditor', {})}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 80 },
  serviceName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  serviceDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  serviceDetail: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  deleteBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
  deleteText: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});
