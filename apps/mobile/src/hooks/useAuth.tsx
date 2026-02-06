import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { getToken, setToken, removeToken } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
  workspace?: {
    id: string;
    type: string;
    name: string;
    profile?: {
      slug: string;
      displayName: string;
      city: string;
      isPublished: boolean;
    };
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const data = await apiGet<{ user: User }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
      await removeToken();
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiPost<{ token: string; user: User }>(
      '/api/auth/login',
      { email, password },
      false
    );
    await setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await apiPost<{ token: string; user: User }>(
      '/api/auth/register',
      { email, password, name },
      false
    );
    await setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
