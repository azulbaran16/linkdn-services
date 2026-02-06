import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { colors, fontSize, spacing, borderRadius } from '../../theme';
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>Reserva confirmada</Text>
          <Text style={styles.successSubtext}>
            Hemos enviado los detalles a tu correo electronico.
          </Text>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Detalles de la reserva</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Servicio</Text>
            <Text style={styles.detailValue}>{serviceName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Proveedor</Text>
            <Text style={styles.detailValue}>{providerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha y hora</Text>
            <Text style={styles.detailValue}>{formatDateTime(startTime)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Gestionar reserva</Text>
          <Text style={styles.manageText}>
            Puedes reprogramar o cancelar tu reserva desde el enlace enviado a tu correo,
            o usando el boton a continuacion.
          </Text>
          <Button
            title="Gestionar reserva"
            onPress={() =>
              navigation.getParent()?.getParent()?.navigate('ManageBooking', { token: manageToken })
            }
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        <Button
          title="Compartir"
          onPress={handleShare}
          variant="secondary"
          style={{ marginTop: spacing.sm }}
        />

        <Button
          title="Volver al inicio"
          onPress={() => navigation.popToTop()}
          variant="outline"
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  successBanner: {
    backgroundColor: '#d4edda',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#155724',
  },
  successSubtext: {
    fontSize: fontSize.sm,
    color: '#155724',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  manageText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
