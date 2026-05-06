import { http } from './http';
import { AuthUser } from '../types/auth';

export const updateProfile = async (payload: {
  name: string;
  username: string;
  email?: string | null;
}): Promise<AuthUser> => {
    const data = await http.put<AuthUser>('/users/profile', payload);
    return data;
};

export const updatePassword = async (payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const data = await http.put<{ message: string }>('/users/password', payload);
    return data;
};

export const deleteAccount = async (password: string): Promise<void> => {
    await http.delete('/users/account', { password });
    if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
    }
};
