export const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (configured) return String(configured).replace(/\/$/, '');

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  if (hostname.includes('vercel.app')) return `${protocol}//${hostname}/api`;
  
  // Always use port 3000 for backend API in development
  return `${protocol}//${hostname}:3000/api`;
};
const API_BASE = getApiBaseUrl();

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpError = {
  status: number;
  message: string;
  details?: unknown;
  raw?: unknown;
};

const parseErrorResponse = async (res: Response): Promise<Omit<HttpError, 'status'>> => {
  const contentType = res.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const body = await res.json();
      const message =
        typeof body?.message === 'string'
          ? body.message
          : typeof body?.error === 'string'
            ? body.error
            : res.statusText || 'Terjadi kesalahan pada server';

      return {
        message,
        details: body?.details,
        raw: body,
      };
    }

    const text = await res.text();
    return {
      message: text || res.statusText || 'Terjadi kesalahan pada server',
      raw: text,
    };
  } catch {
    return {
      message: res.statusText || 'Terjadi kesalahan pada server',
    };
  }
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || 'GET');
    if (isMutation) {
      throw {
        status: 0,
        message: 'Aksi dibatalkan. Anda sedang offline dan tidak dapat melakukan perubahan data.',
        details: 'OFFLINE_MUTATION'
      } as HttpError;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw {
      status: 0,
      message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
      details: 'NETWORK_ERROR'
    } as HttpError;
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      // Only force-redirect if we're NOT already on the login page (/) 
      // and NOT doing the initial auth check (/auth/me)
      const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
      const isAuthCheck = path === '/auth/me';
      if (!isLoginPage && !isAuthCheck) {
        window.location.href = '/';
      }
    }

    const error = await parseErrorResponse(res);
    throw { status: res.status, ...error } as HttpError;
  }
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T, B = unknown>(path: string, body?: B) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T, B = unknown>(path: string, body?: B) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T, B = unknown>(path: string, body?: B) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T, B = unknown>(path: string, body?: B) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};
