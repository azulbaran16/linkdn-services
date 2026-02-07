import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { LoadingScreen } from '../components/LoadingScreen';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { ManageBookingScreen } from '../screens/booking/ManageBookingScreen';
import { colors, fontWeight } from '../theme';

export type RootStackParamList = {
  Auth: undefined;
  RoleSelection: undefined;
  Main: undefined;
  ManageBooking: { token: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const { hasChosenRole } = useRole();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.neutral900,
        headerTitleStyle: { fontWeight: fontWeight.semibold },
        headerShadowVisible: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{ headerShown: false }}
        />
      ) : !hasChosenRole ? (
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="Main"
          component={MainTabs}
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
