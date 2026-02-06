import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorMessage } from '../../components/ErrorMessage';
import { colors, fontSize, spacing, borderRadius } from '../../theme';
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
  }[];
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export function ProviderProfileScreen({ navigation, route }: Props) {
  const { slug } = route.params;

  const { data, isLoading, error } = useQuery({
    queryKey: ['provider-profile', slug],
    queryFn: () => apiGet<{ profile: ProviderProfile }>(`/api/marketplace/${slug}`, false),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <View style={styles.container}><ErrorMessage message="Proveedor no encontrado" /></View>;

  const profile = data?.profile;
  if (!profile) return <View style={styles.container}><ErrorMessage message="Proveedor no encontrado" /></View>;

  // Group availability by day
  const availByDay = profile.availability.reduce<Record<number, string[]>>((acc, rule) => {
    if (!acc[rule.dayOfWeek]) acc[rule.dayOfWeek] = [];
    acc[rule.dayOfWeek].push(`${rule.startTime} - ${rule.endTime}`);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.city}>{profile.city}</Text>
          <View style={styles.tagsRow}>
            {profile.categories.map((cat) => (
              <View key={cat.id} style={styles.tag}>
                <Text style={styles.tagText}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        {profile.description ? (
          <Card>
            <Text style={styles.sectionTitle}>Acerca de</Text>
            <Text style={styles.description}>{profile.description}</Text>
          </Card>
        ) : null}

        {/* Contact */}
        {(profile.contactEmail || profile.contactPhone) && (
          <Card>
            <Text style={styles.sectionTitle}>Contacto</Text>
            {profile.contactEmail ? (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${profile.contactEmail}`)}>
                <Text style={styles.contactText}>{profile.contactEmail}</Text>
              </TouchableOpacity>
            ) : null}
            {profile.contactPhone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${profile.contactPhone}`)}>
                <Text style={styles.contactText}>{profile.contactPhone}</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        )}

        {/* Availability */}
        {Object.keys(availByDay).length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            {Object.entries(availByDay)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, times]) => (
                <View key={day} style={styles.availRow}>
                  <Text style={styles.availDay}>{DAY_NAMES[Number(day)]}</Text>
                  <Text style={styles.availTime}>{times.join(', ')}</Text>
                </View>
              ))}
          </Card>
        )}

        {/* Services */}
        <Text style={styles.sectionTitle}>Servicios</Text>
        {profile.services.map((service) => (
          <Card key={service.id}>
            <Text style={styles.serviceName}>{service.name}</Text>
            {service.description ? (
              <Text style={styles.serviceDesc}>{service.description}</Text>
            ) : null}
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceDetail}>{service.durationMinutes} min</Text>
              {service.priceFrom !== null && (
                <Text style={styles.serviceDetail}>
                  Desde ${Number(service.priceFrom).toLocaleString('es-CO')}
                </Text>
              )}
            </View>
            <Button
              title="Reservar"
              onPress={() =>
                navigation.navigate('BookingWizard', {
                  slug: profile.slug,
                  serviceId: service.id,
                  serviceName: service.name,
                })
              }
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        ))}

        {profile.services.length === 0 && (
          <Text style={styles.noServices}>
            Este proveedor aun no tiene servicios disponibles.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  city: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.white,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  availRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  availDay: {
    width: 40,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  availTime: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  serviceName: {
    fontSize: fontSize.md,
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
  noServices: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingTop: spacing.lg,
  },
});
