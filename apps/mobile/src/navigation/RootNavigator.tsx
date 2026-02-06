import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/LoadingScreen';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ManageBookingScreen } from '../screens/booking/ManageBookingScreen';
import { colors } from '../theme';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ManageBooking: { token: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{ headerShown: false }}
        />
      )}
      <Stack.Screen
        name="ManageBooking"
        component={ManageBookingScreen}
        options={{ title: 'Gestionar reserva' }}
      />
    </Stack.Navigator>
  );
}
