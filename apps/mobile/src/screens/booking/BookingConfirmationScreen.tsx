import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  screenPadding,
} from '../../theme';
import { MarketplaceStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'BookingConfirmation'>;

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function BookingConfirmationScreen({ navigation, route }: Props) {
  const { serviceName, providerName, startTime, endTime, manageToken } = route.params;

  const manageUrl = `linkdn-services://booking/manage/${manageToken}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Reserva confirmada: ${serviceName} con ${providerName} el ${formatDateTime(startTime)}`,
      });
    } catch {
      // Ignore share errors
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Success hero section */}
      <View style={styles.heroSection}>
        {/* Check circle */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>{'\u2713'}</Text>
        </View>

        <Text style={styles.heroTitle}>Reserva confirmada!</Text>
        <Text style={styles.heroSubtitle}>
          Hemos enviado los detalles a tu correo electronico.
        </Text>
      </View>

      {/* Details card */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Detalles de la reserva</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Servicio</Text>
          <Text style={styles.detailValue}>{serviceName}</Text>
        </View>
        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Proveedor</Text>
          <Text style={styles.detailValue}>{providerName}</Text>
        </View>
        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fecha y hora</Text>
          <Text style={styles.detailValue}>{formatDateTime(startTime)}</Text>
        </View>
      </View>

      {/* CTA buttons */}
      <View style={styles.ctaSection}>
        <Button
          title="Ver mi reserva"
          onPress={() =>
            navigation.getParent()?.getParent()?.navigate('ManageBooking', { token: manageToken })
          }
        />

        <Button
          title="Volver al inicio"
          onPress={() => navigation.popToTop()}
          variant="ghost"
          style={styles.ghostButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
  },
  scrollContent: {
    ...screenPadding,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
  },

  // --- Hero section ---
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  checkMark: {
    fontSize: 36,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral500,
    textAlign: 'center',
    lineHeight: 20,
  },

  // --- Details card ---
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  detailsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.ms,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral500,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral900,
    flex: 1,
    textAlign: 'right',
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.neutral200,
  },

  // --- CTA section ---
  ctaSection: {
    gap: spacing.sm,
  },
  ghostButton: {
    marginTop: spacing.xs,
  },
});
