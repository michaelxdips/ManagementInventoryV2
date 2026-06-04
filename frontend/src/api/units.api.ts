import { http } from './http';

export type UnitItem = {
  id: number;
  name: string;
  username: string;
};

export type CreateUnitPayload = {
  unitName: string;
  username: string;
  password: string;
};

export type UpdateUnitPayload = {
  name: string;
  username: string;
};

export type ResetPasswordPayload = {
  newPassword: string;
};

export const fetchUnits = () => http.get<UnitItem[]>('/units');
export const fetchUnitNames = () => http.get<string[]>('/units/names');
export const createUnit = (payload: CreateUnitPayload) => http.post<UnitItem>('/units', payload);
export const deleteUnit = (id: number) => http.delete<void>(`/units/${id}`);
export const updateUnit = (id: number, payload: UpdateUnitPayload) => http.put<UnitItem>(`/units/${id}`, payload);
export const resetUnitPassword = (id: number, payload: ResetPasswordPayload) => http.patch<{ message: string }>(`/units/${id}/password`, payload);
