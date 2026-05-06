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

export const fetchUnits = () => http.get<UnitItem[]>('/units');
export const fetchUnitNames = () => http.get<string[]>('/units/names');
export const createUnit = (payload: CreateUnitPayload) => http.post<UnitItem>('/units', payload);
export const deleteUnit = (id: number) => http.delete<void>(`/units/${id}`);
