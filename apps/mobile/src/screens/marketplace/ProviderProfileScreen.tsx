import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet } from '../../lib/api';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorMessage } from '../../components/ErrorMessage';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '../../theme';
import { MarketplaceStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'ProviderProfile'>;

interface ProviderProfile {
  slug: string;
  displayName: string;
  city: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  portfolioLinks: string[];
  logoUrl: string;
  categories: { id: string; name: string; slug: string }[];
  services: {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    priceFrom: number | null;
    images?: string[];
  }[];
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

const HERO_HEIGHT = 240;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const SERVICE_ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  limpieza: 'cleaning-services',
  cleaning: 'cleaning-services',
  sanitizar: 'sanitizer',
  sanitizer: 'sanitizer',
  cocina: 'countertops',
  countertops: 'countertops',
  reparacion: 'build',
  build: 'build',
  spa: 'spa',
  bienestar: 'spa',
  masaje: 'spa',
};

function getServiceIcon(serviceName: string): string {
  const lower = serviceName.toLowerCase();
  for (const [key, icon] of Object.entries(SERVICE_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return 'check-circle';
}

export function ProviderProfileScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const insets = useSafeAreaInsets();

  const { data, isLoading, error } = useQuery({
    queryKey: ['provider-profile', slug],
    queryFn: () => apiGet<{ profile: ProviderProfile }>(`/api/marketplace/${slug}`, false),
  });

  if (isLoading) return <LoadingScreen />;
  if (error)
    return (
      <View style={styles.container}>
        <ErrorMessage message="Proveedor no encontrado" />
      </View>
    );

  const profile = data?.profile;
  if (!profile)
    return (
      <View style={styles.container}>
        <ErrorMessage message="Proveedor no encontrado" />
      </View>
    );

  // Group availability by day
  const availByDay = profile.availability.reduce<Record<number, string[]>>((acc, rule) => {
    if (!acc[rule.dayOfWeek]) acc[rule.dayOfWeek] = [];
    acc[rule.dayOfWeek].push(`${rule.startTime} - ${rule.endTime}`);
    return acc;
  }, {});

  const firstService = profile.services.length > 0 ? profile.services[0] : null;
  const displayPrice =
    firstService?.priceFrom !== null && firstService?.priceFrom !== undefined
      ? `$${Number(firstService.priceFrom).toLocaleString('es-CO')}`
      : 'Consultar';

  const handleBooking = () => {
    if (firstService) {
      navigation.navigate('BookingWizard', {
        slug: profile.slug,
        serviceId: firstService.id,
        serviceName: firstService.name,
        priceFrom: firstService.priceFrom ?? undefined,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Hero image area ─────────────────────── */}
        <View style={styles.heroContainer}>
          {profile.logoUrl ? (
            <Image source={{ uri: profile.logoUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroBackground} />
          )}
          <View style={styles.heroGradient} />
        </View>

        {/* ── Title + Price section ───────────────── */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.displayName} numberOfLines={2}>
              {profile.displayName}
            </Text>
            <Text style={styles.headerPrice}>{displayPrice}</Text>
          </View>

          {/* Badges row: Popular + Rating */}
          <View style={styles.badgesRow}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Popular</Text>
            </View>
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={18} color={colors.warning} />
              <Text style={styles.ratingValue}>4.8</Text>
              <Text style={styles.ratingCount}>(120 reviews)</Text>
            </View>
          </View>
        </View>

        {/* ── Divider ─────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Sobre este servicio ─────────────────── */}
        {profile.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre este servicio</Text>
            <Text style={styles.descriptionText}>{profile.description}</Text>
            <TouchableOpacity>
              <Text style={styles.readMoreLink}>Leer mas</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Lo que incluye ─────────────────────── */}
        {profile.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lo que incluye</Text>
            {profile.services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                {service.images && service.images[0] ? (
                  <Image source={{ uri: service.images[0] }} style={styles.serviceThumb} />
                ) : (
                  <View style={styles.serviceIconCircle}>
                    <MaterialIcons
                      name={getServiceIcon(service.name) as any}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                )}
                <View style={styles.serviceCardContent}>
                  <Text style={styles.serviceCardName}>{service.name}</Text>
                  {service.description ? (
                    <Text style={styles.serviceCardDesc}>{service.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {profile.services.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.noServices}>
              Este proveedor aun no tiene servicios disponibles.
            </Text>
          </View>
        )}

        {/* ── Disponibilidad ─────────────────────── */}
        {Object.keys(availByDay).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            <View style={styles.availCard}>
              {Object.entries(availByDay)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, times], index, arr) => (
                  <View
                    key={day}
                    style={[
                      styles.availRow,
                      index < arr.length - 1 && styles.availRowBorder,
                    ]}
                  >
                    <Text style={styles.availDay}>{DAY_NAMES[Number(day)]}</Text>
                    <Text style={styles.availTime}>{times.join(', ')}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* ── Contacto ───────────────────────────── */}
        {(profile.contactEmail || profile.contactPhone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <View style={styles.contactCard}>
              {profile.contactEmail ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`mailto:${profile.contactEmail}`)}
                  style={styles.contactRow}
                >
                  <MaterialIcons name="email" size={20} color={colors.primary} />
                  <Text style={styles.contactText}>{profile.contactEmail}</Text>
                </TouchableOpacity>
              ) : null}
              {profile.contactPhone ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${profile.contactPhone}`)}
                  style={styles.contactRow}
                >
                  <MaterialIcons name="phone" size={20} color={colors.primary} />
                  <Text style={styles.contactText}>{profile.contactPhone}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky bottom action bar ─────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomPriceBlock}>
            <Text style={styles.bottomPriceLabel}>Precio total</Text>
            <Text style={styles.bottomPriceValue}>{displayPrice}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBooking}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Reservar Ahora</Text>
            <MaterialIcons name="arrow-forward" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  /* ── Hero ─────────────────────────────── */
  heroContainer: {
    height: HERO_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryLight,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_HEIGHT / 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  /* ── Title + Price ────────────────────── */
  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  displayName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.neutral900,
    flex: 1,
    marginRight: spacing.ms,
  },
  headerPrice: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.ms,
  },
  popularBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  popularBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
  },
  ratingCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.neutral500,
  },

  /* ── Divider ──────────────────────────── */
  divider: {
    height: 1,
    backgroundColor: colors.neutral200,
    marginHorizontal: spacing.lg,
  },

  /* ── Sections ─────────────────────────── */
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.ms,
  },

  /* ── Description ──────────────────────── */
  descriptionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.neutral700,
    lineHeight: 24,
  },
  readMoreLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.sm,
  },

  /* ── Service cards (Lo que incluye) ──── */
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: borderRadius.xl,
    padding: spacing.ms,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  serviceThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.ms,
  },
  serviceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.ms,
  },
  serviceCardContent: {
    flex: 1,
  },
  serviceCardName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
  },
  serviceCardDesc: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: colors.neutral500,
    marginTop: 2,
  },

  /* ── No services ──────────────────────── */
  noServices: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.neutral500,
    textAlign: 'center',
    paddingTop: spacing.lg,
  },

  /* ── Availability ─────────────────────── */
  availCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  availRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  availRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  availDay: {
    width: 44,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
  },
  availTime: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.neutral700,
  },

  /* ── Contact ──────────────────────────── */
  contactCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  contactText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },

  /* ── Sticky bottom bar ────────────────── */
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    paddingTop: spacing.ms,
    paddingHorizontal: spacing.lg,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomPriceBlock: {
    marginRight: spacing.md,
  },
  bottomPriceLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: colors.neutral500,
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
  },
  bookButton: {
    flex: 1,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bookButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
