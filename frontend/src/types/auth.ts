export type Role = 'admin' | 'user' | 'superadmin';

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  /** Optional; digunakan untuk email status permintaan */
  email?: string | null;
};

export type LoginPayload = {
  username: string;
  password: string;
  remember?: boolean;
  role?: Role;
};
