import { http } from './http';

type AnnouncementApiRow = {
  id: number;
  title: string;
  content: string;
  is_active: boolean | number | string;
  created_at: string;
  created_by: number | null;
};

export type AnnouncementRow = Omit<AnnouncementApiRow, 'is_active'> & {
  is_active: boolean;
};

const normalizeAnnouncement = (row: AnnouncementApiRow): AnnouncementRow => ({
  ...row,
  is_active: row.is_active === true || row.is_active === 1 || row.is_active === '1',
});

export async function fetchAnnouncements(): Promise<AnnouncementRow[]> {
  const rows = await http.get<AnnouncementApiRow[]>('/announcements');
  return rows.map(normalizeAnnouncement);
}

export async function fetchActiveAnnouncements(): Promise<AnnouncementRow[]> {
  const rows = await http.get<AnnouncementApiRow[]>('/announcements/active');
  return rows.map(normalizeAnnouncement);
}

export async function createAnnouncement(body: {
  title: string;
  content: string;
  is_active?: boolean;
}): Promise<AnnouncementRow> {
  const row = await http.post<AnnouncementApiRow, typeof body>('/announcements', body);
  return normalizeAnnouncement(row);
}

export async function updateAnnouncement(
  id: number,
  body: Partial<{ title: string; content: string; is_active: boolean }>
): Promise<AnnouncementRow> {
  const row = await http.patch<AnnouncementApiRow, typeof body>(`/announcements/${id}`, body);
  return normalizeAnnouncement(row);
}

export async function deleteAnnouncement(id: number): Promise<void> {
  return http.delete<void>(`/announcements/${id}`);
}
