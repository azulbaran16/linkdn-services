import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRole } from '../hooks/useRole';
import { colors, fontSize, fontWeight } from '../theme';

// Provider screens
import { DashboardScreen } from '../screens/provider/DashboardScreen';
import { ProfileEditorScreen } from '../screens/provider/ProfileEditorScreen';
import { ServicesListScreen } from '../screens/provider/ServicesListScreen';
import { ServiceEditorScreen } from '../screens/provider/ServiceEditorScreen';
import { AvailabilityEditorScreen } from '../screens/provider/AvailabilityEditorScreen';
import { ClientsListScreen } from '../screens/provider/ClientsListScreen';
import { NotificationsScreen } from '../screens/provider/NotificationsScreen';

// Marketplace screens
import { MarketplaceSearchScreen } from '../screens/marketplace/MarketplaceSearchScreen';
import { ProviderProfileScreen } from '../screens/marketplace/ProviderProfileScreen';
import { BookingWizardScreen } from '../screens/booking/BookingWizardScreen';
import { BookingConfirmationScreen } from '../screens/booking/BookingConfirmationScreen';
import { PaymentWebViewScreen } from '../screens/booking/PaymentWebViewScreen';

// Client screens
import { MyAppointmentsScreen } from '../screens/client/MyAppointmentsScreen';

// Profile screens
import { ProfileTabScreen } from '../screens/ProfileTabScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';

const headerOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.neutral900,
  headerTitleStyle: { fontWeight: fontWeight.semibold },
  headerShadowVisible: false,
};

// === Type definitions ===

export type ProviderStackParamList = {
  Dashboard: undefined;
  ProfileEditor: undefined;
  ServicesList: undefined;
  ServiceEditor: { serviceId?: string };
  AvailabilityEditor: undefined;
  ClientsList: undefined;
  ClientDetail: { clientId: string };
  Notifications: undefined;
};

export type MarketplaceStackParamList = {
  MarketplaceSearch: undefined;
  ProviderProfile: { slug: string };
  BookingWizard: { slug: string; serviceId: string; serviceName: string; priceFrom?: number };
  BookingConfirmation: {
    bookingId: string;
    serviceName: string;
    providerName: string;
    startTime: string;
    endTime: string;
    manageToken: string;
  };
  PaymentWebView: {
    paymentUrl: string;
    bookingId: string;
    manageToken: string;
    serviceName: string;
    providerName: string;
    startTime: string;
    endTime: string;
  };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  PaymentHistory: undefined;
};

export type AppointmentsStackParamList = {
  AppointmentsList: undefined;
  ManageBooking: { token: string };
};

// === Stack Navigators ===

const ProviderStack = createNativeStackNavigator<ProviderStackParamList>();
const MarketStack = createNativeStackNavigator<MarketplaceStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();
const AppointmentsStackNav = createNativeStackNavigator<AppointmentsStackParamList>();

function ProviderNavigator() {
  return (
    <ProviderStack.Navigator screenOptions={headerOptions as any}>
      <ProviderStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Mi negocio', headerShown: false }}
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
      <ProviderStack.Screen
        name="ClientsList"
        component={ClientsListScreen}
        options={{ title: 'Mis clientes' }}
      />
      <ProviderStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
    </ProviderStack.Navigator>
  );
}

function MarketplaceNavigator() {
  return (
    <MarketStack.Navigator screenOptions={headerOptions as any}>
      <MarketStack.Screen
        name="MarketplaceSearch"
        component={MarketplaceSearchScreen}
        options={{ title: 'Explorar', headerShown: false }}
      />
      <MarketStack.Screen
        name="ProviderProfile"
        component={ProviderProfileScreen}
        options={{ title: '' }}
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
      <MarketStack.Screen
        name="PaymentWebView"
        component={PaymentWebViewScreen}
        options={{ title: 'Pago' }}
      />
    </MarketStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStackNav.Navigator screenOptions={headerOptions as any}>
      <ProfileStackNav.Screen
        name="ProfileHome"
        component={ProfileTabScreen}
        options={{ headerShown: false }}
      />
      <ProfileStackNav.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Editar perfil' }}
      />
      <ProfileStackNav.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notificaciones' }}
      />
      <ProfileStackNav.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{ title: 'Metodos de pago' }}
      />
    </ProfileStackNav.Navigator>
  );
}

function AppointmentsNavigator() {
  return (
    <AppointmentsStackNav.Navigator screenOptions={headerOptions as any}>
      <AppointmentsStackNav.Screen
        name="AppointmentsList"
        component={MyAppointmentsScreen}
        options={{ headerShown: false }}
      />
    </AppointmentsStackNav.Navigator>
  );
}

// === Home stack for client (wraps MarketplaceNavigator as "Inicio") ===

function HomeNavigator() {
  return <MarketplaceNavigator />;
}

// === Tab Navigators ===

const ProviderTabs = createBottomTabNavigator();
const ClientTabs = createBottomTabNavigator();

function ProviderMainTabs() {
  return (
    <ProviderTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral500,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <ProviderTabs.Screen
        name="ProviderTab"
        component={ProviderNavigator}
        options={{
          title: 'Mi negocio',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="store" size={size} color={color} />
          ),
        }}
      />
      <ProviderTabs.Screen
        name="ExploreTab"
        component={MarketplaceNavigator}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
        }}
      />
      <ProviderTabs.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </ProviderTabs.Navigator>
  );
}

function ClientMainTabs() {
  return (
    <ClientTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral500,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <ClientTabs.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <ClientTabs.Screen
        name="ExploreTab"
        component={MarketplaceNavigator}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
        }}
      />
      <ClientTabs.Screen
        name="AppointmentsTab"
        component={AppointmentsNavigator}
        options={{
          title: 'Citas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-today" size={size} color={color} />
          ),
        }}
      />
      <ClientTabs.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </ClientTabs.Navigator>
  );
}

// === Main Export ===

export function MainTabs() {
  const { role } = useRole();

  if (role === 'client') {
    return <ClientMainTabs />;
  }

  return <ProviderMainTabs />;
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.neutral200,
    borderTopWidth: 1,
    paddingBottom: 4,
    height: 60,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
