import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { LoadingScreen } from '../../components/LoadingScreen';
import { SkeletonCard } from '../../components/Skeleton';
import { colors, fontSize, fontWeight, spacing, borderRadius, screenPadding } from '../../theme';
import { ProviderStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ProviderStackParamList, 'ClientsList'>;

interface ClientItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  lastVisit: string | null;
  lastService: string | null;
  totalSpent: number;
  isFrequent: boolean;
}

export function ClientsListScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('lastVisit');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, sort],
    queryFn: () =>
      apiGet<{ clients: ClientItem[] }>(
        `/api/clients?search=${encodeURIComponent(search)}&sort=${sort}`
      ),
  });

  const clients = data?.clients || [];

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatDate = (date: string | null) => {
    if (!date) return 'Sin visitas';
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderClient = ({ item }: { item: ClientItem }) => (
    <Card
      onPress={() => navigation.navigate('ClientDetail' as any, { clientId: item.id })}
      style={styles.clientCard}
    >
      <View style={styles.clientRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(item.name)}</Text>
        </View>
        <View style={styles.clientInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.clientName}>{item.name}</Text>
            {item.isFrequent && <Badge label="Frecuente" variant="primary" />}
          </View>
          <Text style={styles.clientEmail}>{item.email}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.stat}>{item.totalVisits} visita(s)</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.stat}>{formatDate(item.lastVisit)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor={colors.neutral500}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.sortRow}>
        {[
          { key: 'lastVisit', label: 'Recientes' },
          { key: 'frequent', label: 'Frecuentes' },
          { key: 'name', label: 'Nombre' },
        ].map((s) => (
          <Pressable
            key={s.key}
            style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
            onPress={() => setSort(s.key)}
          >
            <Text style={[styles.sortChipText, sort === s.key && styles.sortChipTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : clients.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sin clientes aun</Text>
          <Text style={styles.emptyDesc}>
            Cuando recibas tu primera reserva, tus clientes apareceran aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
  },
  searchContainer: {
    ...screenPadding,
    paddingVertical: spacing.ms,
  },
  searchInput: {
    height: 44,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.neutral900,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    ...screenPadding,
    marginBottom: spacing.ms,
  },
  sortChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.ms,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.neutral700,
  },
  sortChipTextActive: {
    color: colors.white,
  },
  list: {
    ...screenPadding,
    paddingBottom: spacing['3xl'],
  },
  skeletonContainer: {
    ...screenPadding,
  },
  clientCard: {
    paddingVertical: spacing.ms,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  clientInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clientName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
  },
  clientEmail: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  stat: {
    fontSize: fontSize.xs,
    color: colors.neutral700,
  },
  statDot: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
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
