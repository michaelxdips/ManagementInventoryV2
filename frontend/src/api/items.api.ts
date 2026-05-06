import { http } from './http';
import type { PaginationMeta } from './history.api';

export type Item = {
  id: number;
  name: string;
  code: string;
  quantity: number;
  unit: string;
  location: string;
  minStock: number;
};

export type UpdateItemPayload = {
  nama_barang: string;
  kode_barang: string;
  qty: number;
  satuan: string;
  lokasi_simpan: string;
  min_stock?: number;
};

export type ItemsQuery = {
  page?: number;
  perPage?: number;
  search?: string;
};

type RawItem = {
  id: number;
  nama_barang?: string;
  nama?: string;
  name?: string;
  kode_barang?: string;
  code?: string;
  qty?: number;
  stok?: number;
  quantity?: number;
  satuan?: string;
  unit?: string;
  lokasi_simpan?: string;
  location?: string;
  min_stock?: number;
};

export type ItemsPage = {
  items: Item[];
  pagination: PaginationMeta;
};

type RawItemsPage = {
  items: RawItem[];
  pagination: PaginationMeta;
};

const mapItem = (r: RawItem): Item => ({
  id: r.id,
  name: r.nama_barang ?? r.nama ?? r.name ?? '',
  code: r.kode_barang ?? r.code ?? '',
  quantity: r.qty ?? r.stok ?? r.quantity ?? 0,
  unit: r.satuan ?? r.unit ?? '',
  location: r.lokasi_simpan ?? r.location ?? '-',
  minStock: r.min_stock ?? 5,
});

const buildQuery = (query?: ItemsQuery) => {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.perPage) params.set('perPage', String(query.perPage));
  if (query.search) params.set('search', query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const fetchItemsPage = async (query?: ItemsQuery): Promise<ItemsPage> => {
  const data = await http.get<RawItemsPage>(`/atk-items${buildQuery(query)}`);
  return {
    items: data.items.map(mapItem),
    pagination: data.pagination,
  };
};

export const fetchItems = () =>
  http.get<RawItem[] | RawItemsPage>('/atk-items').then((data) => {
    const rows = Array.isArray(data) ? data : data.items;
    return rows.map(mapItem);
  });

export const getItemById = (id: number) =>
  http.get<RawItem>(`/atk-items/${id}`).then(mapItem);

export const updateItem = (id: number, payload: UpdateItemPayload) =>
  http.put(`/atk-items/${id}`, payload);

export const deleteItem = (id: number) =>
  http.delete<{ message: string }>(`/atk-items/${id}`);
