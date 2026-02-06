import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors, fontSize } from '../theme';

// Provider screens
import { DashboardScreen } from '../screens/provider/DashboardScreen';
import { ProfileEditorScreen } from '../screens/provider/ProfileEditorScreen';
import { ServicesListScreen } from '../screens/provider/ServicesListScreen';
import { ServiceEditorScreen } from '../screens/provider/ServiceEditorScreen';
import { AvailabilityEditorScreen } from '../screens/provider/AvailabilityEditorScreen';

// Marketplace screens
import { MarketplaceSearchScreen } from '../screens/marketplace/MarketplaceSearchScreen';
import { ProviderProfileScreen } from '../screens/marketplace/ProviderProfileScreen';
import { BookingWizardScreen } from '../screens/booking/BookingWizardScreen';
import { BookingConfirmationScreen } from '../screens/booking/BookingConfirmationScreen';

export type ProviderStackParamList = {
  Dashboard: undefined;
  ProfileEditor: undefined;
  ServicesList: undefined;
  ServiceEditor: { serviceId?: string };
  AvailabilityEditor: undefined;
};

export type MarketplaceStackParamList = {
  MarketplaceSearch: undefined;
  ProviderProfile: { slug: string };
  BookingWizard: { slug: string; serviceId: string; serviceName: string };
  BookingConfirmation: {
    bookingId: string;
    serviceName: string;
    providerName: string;
    startTime: string;
    endTime: string;
    manageToken: string;
  };
};

const Tab = createBottomTabNavigator();
const ProviderStack = createNativeStackNavigator<ProviderStackParamList>();
const MarketStack = createNativeStackNavigator<MarketplaceStackParamList>();

function ProviderNavigator() {
  return (
    <ProviderStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ProviderStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Mi negocio' }}
      />
      <ProviderStack.Screen
        name="ProfileEditor"
        component={ProfileEditorScreen}
        options={{ title: 'Editar perfil' }}
      />
      <ProviderStack.Screen
        name="ServicesList"
        component={ServicesListScreen}
        options={{ title: 'Mis servicios' }}
      />
      <ProviderStack.Screen
        name="ServiceEditor"
        component={ServiceEditorScreen}
        options={{ title: 'Servicio' }}
      />
      <ProviderStack.Screen
        name="AvailabilityEditor"
        component={AvailabilityEditorScreen}
        options={{ title: 'Disponibilidad' }}
      />
    </ProviderStack.Navigator>
  );
}

function MarketplaceNavigator() {
  return (
    <MarketStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <MarketStack.Screen
        name="MarketplaceSearch"
        component={MarketplaceSearchScreen}
        options={{ title: 'Explorar' }}
      />
      <MarketStack.Screen
        name="ProviderProfile"
        component={ProviderProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <MarketStack.Screen
        name="BookingWizard"
        component={BookingWizardScreen}
        options={{ title: 'Reservar' }}
      />
      <MarketStack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{ title: 'Confirmacion', headerBackVisible: false }}
      />
    </MarketStack.Navigator>
  );
}

// Simple text-based tab icons for MVP
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: fontSize.xs, color: focused ? colors.primary : colors.textMuted }}>
      {label}
    </Text>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { paddingBottom: 4, height: 56 },
      }}
    >
      <Tab.Screen
        name="ProviderTab"
        component={ProviderNavigator}
        options={{
          title: 'Mi negocio',
          tabBarIcon: ({ focused }) => <TabIcon label="N" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceNavigator}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => <TabIcon label="E" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
