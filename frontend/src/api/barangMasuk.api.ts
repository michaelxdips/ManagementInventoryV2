import { http } from './http';

export type BarangMasukItem = {
    id: number;
    date: string;
    name: string;
    code: string;
    qty: number;
    unit: string;
    location: string;
    pic: string;
};

export type CreateBarangMasukPayload = {
    nama_barang: string;
    kode_barang?: string;
    qty: number;
    satuan: string;
    lokasi_simpan?: string;
    tanggal?: string;
};

export const fetchBarangMasuk = () => http.get<BarangMasukItem[]>('/barang-masuk');
export const createBarangMasuk = (payload: CreateBarangMasukPayload) =>
    http.post<{ message: string; item: any }>('/barang-masuk', payload);
