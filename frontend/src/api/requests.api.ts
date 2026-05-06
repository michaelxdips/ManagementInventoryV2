import { http } from './http';

export type RequestStatus = 'PENDING' | 'APPROVAL_REVIEW' | 'APPROVED' | 'REJECTED' | 'FINISHED';

export type RequestItem = {
  id: number;
  date: string;
  item: string;
  qty: number;
  unit: string;
  receiver: string;
  dept: string;
  status: RequestStatus | string;
  reject_reason?: string | null;
  created_at?: string;
  atk_item_id?: number | null;
};

export type CreateRequestPayload = {
  date: string;
  item: string;
  qty: number;
  unit: string;
  receiver: string;
  dept: string;
};

export const fetchRequests = async () => {
  const data = await http.get<RequestItem[] | { requests: RequestItem[] }>('/requests');
  return Array.isArray(data) ? data : data.requests;
};

export const createRequest = (payload: CreateRequestPayload) => http.post<RequestItem>('/requests', payload);
