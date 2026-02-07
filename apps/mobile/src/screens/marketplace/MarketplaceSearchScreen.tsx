import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { apiGet } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../../components/LoadingScreen';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  screenPadding,
  shadows,
} from '../../theme';
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

const CATEGORY_ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  spa: 'spa',
  fitness: 'fitness-center',
  'home-repair': 'home-repair-service',
  education: 'school',
  restaurant: 'restaurant',
  health: 'local-hospital',
  construction: 'build',
  pets: 'pets',
};

function getCategoryIcon(slug: string): keyof typeof MaterialIcons.glyphMap {
  for (const key of Object.keys(CATEGORY_ICON_MAP)) {
    if (slug.includes(key)) {
      return CATEGORY_ICON_MAP[key];
    }
  }
  return 'category';
}

export function MarketplaceSearchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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
  const categories = categoriesData?.categories || [];

  const handleSearch = () => setSearchTrigger((t) => t + 1);

  const handleCategorySelect = (slug: string) => {
    const next = selectedCategory === slug ? '' : slug;
    setSelectedCategory(next);
    setSearchTrigger((t) => t + 1);
  };

  const userName = user?.name?.split(' ')[0] || 'Usuario';

  // -- Render: category grid item --
  const renderCategoryItem = (item: Category) => {
    const isActive = selectedCategory === item.slug;
    const icon = getCategoryIcon(item.slug);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.categoryCard, isActive && styles.categoryCardActive]}
        onPress={() => handleCategorySelect(item.slug)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIconCircle, isActive && styles.categoryIconCircleActive]}>
          <MaterialIcons
            name={icon}
            size={24}
            color={colors.primary}
          />
        </View>
        <Text
          style={[styles.categoryCardText, isActive && styles.categoryCardTextActive]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // -- Render: featured provider card (horizontal scroll) --
  const renderFeaturedCard = ({ item }: { item: ProviderCard }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => navigation.navigate('ProviderProfile', { slug: item.slug })}
      activeOpacity={0.7}
    >
      {item.logoUrl ? (
        <Image source={{ uri: item.logoUrl }} style={styles.featuredImage} resizeMode="cover" />
      ) : (
        <View style={styles.featuredImagePlaceholder} />
      )}
      <View style={styles.featuredCardContent}>
        <Text style={styles.featuredName} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.featuredCity} numberOfLines={1}>
          {item.city}
        </Text>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color={colors.warning} />
          <Text style={styles.ratingText}>4.8</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // -- Render: recommended provider card (vertical list) --
  const renderRecommendedCard = (item: ProviderCard) => (
    <TouchableOpacity
      key={item.slug}
      style={styles.recommendedCard}
      onPress={() => navigation.navigate('ProviderProfile', { slug: item.slug })}
      activeOpacity={0.7}
    >
      {item.logoUrl ? (
        <Image source={{ uri: item.logoUrl }} style={styles.recommendedThumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.recommendedThumbnail, { backgroundColor: colors.primaryLight }]} />
      )}
      <View style={styles.recommendedContent}>
        <Text style={styles.recommendedName} numberOfLines={1}>
          {item.displayName}
        </Text>
        {item.description ? (
          <Text style={styles.recommendedDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.recommendedBottomRow}>
          <Text style={styles.recommendedPrice}>
            Desde ${item.serviceCount > 0 ? (item.serviceCount * 15000).toLocaleString() : '25.000'}
          </Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={12} color={colors.warning} />
            <Text style={styles.ratingTextSmall}>4.8</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // -- Main render --
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header area */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          {/* Greeting */}
          <Text style={styles.greeting}>
            Hola, {userName}! {'\u{1F44B}'}
          </Text>
          <Text style={styles.subtitle}>Encuentra el servicio perfecto</Text>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <MaterialIcons
              name="search"
              size={22}
              color={colors.neutral500}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar servicios..."
              placeholderTextColor={colors.neutral500}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleSearch}
              activeOpacity={0.7}
            >
              {isFetching ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <MaterialIcons name="tune" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => renderCategoryItem(cat))}
          </View>
        </View>

        {/* Servicios Destacados - horizontal scroll */}
        {results.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Servicios Destacados</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllLink}>Ver todos &gt;</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={results}
              renderItem={renderFeaturedCard}
              keyExtractor={(item) => `featured-${item.slug}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              ItemSeparatorComponent={() => <View style={{ width: spacing.ms }} />}
            />
          </View>
        )}

        {/* Recomendado para ti - vertical list */}
        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendado para ti</Text>
            {results.map((item) => renderRecommendedCard(item))}
          </View>
        )}

        {/* Empty state when no results and no categories */}
        {results.length === 0 && categories.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Busca proveedores de servicios en tu ciudad
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // -- Layout --
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // -- Header --
  header: {
    backgroundColor: colors.white,
    ...screenPadding,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    marginBottom: spacing.md,
  },

  // -- Search bar --
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral200,
    paddingHorizontal: spacing.ms,
    ...shadows.card,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: fontSize.md,
    color: colors.neutral900,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  // -- Sections --
  section: {
    ...screenPadding,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.ms,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.ms,
  },
  seeAllLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.ms,
  },

  // -- Category grid (4 columns) --
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryCard: {
    width: '25%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.ms,
    alignItems: 'center',
  },
  categoryCardActive: {
    // Wrapper style; visual active state applied on inner elements
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryIconCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categoryCardText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.neutral700,
    textAlign: 'center',
  },
  categoryCardTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // -- Featured cards (horizontal scroll) --
  featuredList: {
    paddingRight: spacing.lg,
  },
  featuredCard: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.primaryLight,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  featuredCardContent: {
    padding: spacing.ms,
  },
  featuredName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.xs,
  },
  featuredCity: {
    fontSize: fontSize.xs,
    color: colors.neutral500,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
  },
  ratingTextSmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
  },

  // -- Recommended cards (vertical list) --
  recommendedCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.ms,
    marginBottom: spacing.ms,
    ...shadows.card,
  },
  recommendedThumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    marginRight: spacing.ms,
  },
  recommendedContent: {
    flex: 1,
    justifyContent: 'center',
  },
  recommendedName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.xs,
  },
  recommendedDesc: {
    fontSize: fontSize.sm,
    color: colors.neutral500,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  recommendedBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendedPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  // -- Empty state --
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    ...screenPadding,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.neutral500,
    textAlign: 'center',
  },
});
