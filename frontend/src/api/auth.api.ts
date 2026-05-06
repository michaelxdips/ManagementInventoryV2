import { http } from './http';
import { AuthUser, LoginPayload } from '../types/auth';

type LoginResponse = { user: AuthUser; token: string };

export const loginApi = async (payload: LoginPayload): Promise<AuthUser> => {
  try {
    const data = await http.post<LoginResponse>('/auth/login', payload);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    return data.user;
  } catch (err) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    throw err;
  }
};

export const logoutApi = async (): Promise<void> => {
  try {
    await http.post('/auth/logout');
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
};

export const meApi = async (): Promise<AuthUser | null> => {
  try {
    const data = await http.get<AuthUser>('/auth/me');
    return data;
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    return null;
  }
};

