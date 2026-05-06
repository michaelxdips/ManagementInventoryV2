import { http } from './http';

export type BarangKosongItem = {
  id: number;
  name: string;
  code: string | null;
  location: string | null;
};

export const fetchBarangKosong = () => http.get<BarangKosongItem[]>('/barang-kosong');
