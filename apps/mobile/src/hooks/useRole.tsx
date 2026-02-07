import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'provider' | 'client';

interface RoleContextType {
  role: UserRole | null;
  hasChosenRole: boolean;
  setRole: (role: UserRole) => Promise<void>;
  switchRole: () => Promise<void>;
  clearRole: () => Promise<void>;
}

const ROLE_KEY = 'linkdn_user_role';

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [hasChosenRole, setHasChosenRole] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ROLE_KEY).then((stored) => {
      if (stored === 'provider' || stored === 'client') {
        setRoleState(stored);
        setHasChosenRole(true);
      }
      setIsLoaded(true);
    });
  }, []);

  const setRole = useCallback(async (newRole: UserRole) => {
    await AsyncStorage.setItem(ROLE_KEY, newRole);
    setRoleState(newRole);
    setHasChosenRole(true);
  }, []);

  const switchRole = useCallback(async () => {
    const newRole: UserRole = role === 'provider' ? 'client' : 'provider';
    await setRole(newRole);
  }, [role, setRole]);

  const clearRole = useCallback(async () => {
    await AsyncStorage.removeItem(ROLE_KEY);
    setRoleState(null);
    setHasChosenRole(false);
  }, []);

  if (!isLoaded) return null;

  return (
    <RoleContext.Provider value={{ role, hasChosenRole, setRole, switchRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}
