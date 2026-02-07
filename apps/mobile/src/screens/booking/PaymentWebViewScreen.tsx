import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme';
import { MarketplaceStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'PaymentWebView'>;

export function PaymentWebViewScreen({ navigation, route }: Props) {
  const { paymentUrl, bookingId, manageToken, serviceName, providerName, startTime, endTime } = route.params;

  const handleNavigationStateChange = (navState: { url: string }) => {
    // Detect when Wompi redirects back after payment
    if (navState.url.includes('/api/payments/redirect')) {
      // Payment completed (success or failure), go to confirmation
      navigation.replace('BookingConfirmation', {
        bookingId,
        serviceName,
        providerName,
        startTime,
        endTime,
        manageToken,
      });
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
