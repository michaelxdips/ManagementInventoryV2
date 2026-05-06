import { http } from './http';

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T, K extends string> = Record<K, T[]> & {
  pagination: PaginationMeta;
};

export type HistoryEntry = {
  id: number;
  date: string;
  name: string;
  code: string;
  qty: number;
  unit: string;
  pic?: string;
  receiver?: string;
  dept?: string;
  status?: string;  // APPROVED / REJECTED
  reject_reason?: string;
};

export type HistoryFilter = {
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
};

const buildQuery = (filter?: HistoryFilter) => {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.perPage) params.set('perPage', String(filter.perPage));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const unwrapHistory = async (url: string) => {
  const data = await http.get<HistoryEntry[] | PaginatedResponse<HistoryEntry, 'entries'>>(url);
  return Array.isArray(data) ? data : data.entries;
};

export const fetchHistoryMasukPage = (filter?: HistoryFilter) =>
  http.get<PaginatedResponse<HistoryEntry, 'entries'>>(`/history/masuk${buildQuery(filter)}`);

export const fetchHistoryKeluarPage = (filter?: HistoryFilter) =>
  http.get<PaginatedResponse<HistoryEntry, 'entries'>>(`/history/keluar${buildQuery(filter)}`);

// Legacy array helpers kept for existing pages while backend now supports pagination.
export const fetchHistoryMasuk = (filter?: HistoryFilter) => unwrapHistory(`/history/masuk${buildQuery(filter)}`);
export const fetchHistoryKeluar = (filter?: HistoryFilter) => unwrapHistory(`/history/keluar${buildQuery(filter)}`);
