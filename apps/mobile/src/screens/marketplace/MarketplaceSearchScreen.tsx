import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingScreen } from '../../components/LoadingScreen';
import { colors, fontSize, spacing, borderRadius } from '../../theme';
import { MarketplaceStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'MarketplaceSearch'>;

interface ProviderCard {
  slug: string;
  displayName: string;
  city: string;
  description: string;
  logoUrl: string;
  categories: { id: string; name: string; slug: string }[];
  serviceCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function MarketplaceSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ categories: Category[] }>('/api/categories', false),
  });

  // Search results
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['marketplace-search', query, city, selectedCategory, searchTrigger],
    queryFn: () => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (city) params.set('city', city);
      if (selectedCategory) params.set('category', selectedCategory);
      return apiGet<{
        results: ProviderCard[];
        pagination: { total: number; totalPages: number };
      }>(`/api/marketplace/search?${params.toString()}`, false);
    },
  });

  const results = data?.results || [];

  const renderProvider = ({ item }: { item: ProviderCard }) => (
    <Card>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProviderProfile', { slug: item.slug })}
      >
        <Text style={styles.providerName}>{item.displayName}</Text>
        <Text style={styles.providerCity}>{item.city}</Text>
        {item.description ? (
          <Text style={styles.providerDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.tagsRow}>
          {item.categories.map((cat) => (
            <View key={cat.id} style={styles.tag}>
              <Text style={styles.tagText}>{cat.name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.serviceCount}>
            {item.serviceCount} servicio{item.serviceCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.viewProfile}>Ver perfil {'>'}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar servicio o proveedor..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSearchTrigger((t) => t + 1)}
          returnKeyType="search"
        />
        <TextInput
          style={[styles.searchInput, { marginTop: spacing.sm }]}
          placeholder="Ciudad (ej: Bogota)"
          placeholderTextColor={colors.textMuted}
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => setSearchTrigger((t) => t + 1)}
          returnKeyType="search"
        />

        {/* Category filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoriesData?.categories || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryFilters}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory(selectedCategory === item.slug ? '' : item.slug);
                setSearchTrigger((t) => t + 1);
              }}
              style={[
                styles.categoryFilter,
                selectedCategory === item.slug && styles.categoryFilterActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === item.slug && styles.categoryFilterTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        <Button
          title="Buscar"
          onPress={() => setSearchTrigger((t) => t + 1)}
          loading={isFetching}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {/* Results */}
      <FlatList
        data={results}
        renderItem={renderProvider}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {searchTrigger > 0
                  ? 'No se encontraron resultados'
                  : 'Busca proveedores de servicios en tu ciudad'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchSection: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryFilters: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  categoryFilter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
  },
  categoryFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryFilterText: {
    fontSize: fontSize.xs,
    color: colors.text,
  },
  categoryFilterTextActive: {
    color: colors.white,
  },
  resultsList: { padding: spacing.md },
  providerName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  providerCity: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  providerDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  serviceCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  viewProfile: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
