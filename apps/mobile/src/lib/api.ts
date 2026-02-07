import { Platform } from 'react-native';
import { getToken } from './auth';

// Physical device uses LAN IP, web uses localhost, emulator uses 10.0.2.2
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.105:3000';

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(res.status, 'Error de conexion con el servidor');
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error || 'Error desconocido',
      data
    );
  }

  return data as T;
}

// Convenience helpers
export const apiGet = <T = unknown>(path: string, auth = true) =>
  api<T>(path, { auth });

export const apiPost = <T = unknown>(path: string, body: unknown, auth = true) =>
  api<T>(path, { method: 'POST', body, auth });

export const apiPut = <T = unknown>(path: string, body: unknown, auth = true) =>
  api<T>(path, { method: 'PUT', body, auth });

export const apiDelete = <T = unknown>(path: string, auth = true) =>
  api<T>(path, { method: 'DELETE', auth });
