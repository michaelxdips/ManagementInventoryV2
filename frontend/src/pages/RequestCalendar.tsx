import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardList, RotateCcw } from 'lucide-react';
import { fetchRequests, RequestItem } from '../api/requests.api';
import Button from '../components/ui/Button';
import { formatDateV2, getWIBInputDate } from '../utils/dateUtils';
import { SkeletonCard } from '../components/ui/Skeleton';

type StatusBucket = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

type CalendarDay = {
  date: Date;
  key: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const STATUS_META: Record<Exclude<StatusBucket, 'ALL'>, { label: string; tone: string }> = {
  PENDING: { label: 'Pending', tone: 'pending' },
  APPROVED: { label: 'Approved', tone: 'approved' },
  REJECTED: { label: 'Rejected', tone: 'rejected' },
};

const FILTERS: { key: StatusBucket; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const WEEK_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const toWIBKey = (value: string | Date) => getWIBInputDate(value);

const getStatusBucket = (status: string): Exclude<StatusBucket, 'ALL'> | null => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return 'APPROVED';
  if (normalized === 'REJECTED') return 'REJECTED';
  if (normalized === 'FINISHED') return null;
  return 'PENDING';
};

const formatMonthTitle = (date: Date) =>
  date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'long',
    year: 'numeric',
  });

const generateCalendarDays = (monthDate: Date): CalendarDay[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = toWIBKey(date);
    return {
      date,
      key,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: key === getWIBInputDate(),
    };
  });
};

const RequestCalendar = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => getWIBInputDate());
  const [filter, setFilter] = useState<StatusBucket>('ALL');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRequests()
      .then(setRequests)
      .catch(() => setError('Gagal memuat data request'))
      .finally(() => setLoading(false));
  }, []);

  const calendarDays = useMemo(() => generateCalendarDays(activeMonth), [activeMonth]);

  const monthKeys = useMemo(() => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const start = toWIBKey(new Date(year, month, 1));
    const end = toWIBKey(new Date(year, month + 1, 0));
    return { start, end };
  }, [activeMonth]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const bucket = getStatusBucket(request.status);
      if (!bucket) return false;
      return filter === 'ALL' || bucket === filter;
    });
  }, [requests, filter]);

  const requestsByDate = useMemo(() => {
    const map = new Map<string, RequestItem[]>();
    filteredRequests.forEach((request) => {
      const key = toWIBKey(request.date);
      const current = map.get(key) || [];
      current.push(request);
      map.set(key, current);
    });
    return map;
  }, [filteredRequests]);

  const monthRequests = useMemo(() => {
    return requests.filter((request) => {
      if (!getStatusBucket(request.status)) return false;
      const key = toWIBKey(request.date);
      return key >= monthKeys.start && key <= monthKeys.end;
    });
  }, [requests, monthKeys]);

  const summary = useMemo(() => {
    const counts = {
      total: monthRequests.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    monthRequests.forEach((request) => {
      const bucket = getStatusBucket(request.status);
      if (bucket) counts[bucket] += 1;
    });

    return counts;
  }, [monthRequests]);

  const selectedRequests = requestsByDate.get(selectedDate) || [];

  const moveMonth = (offset: number) => {
    setActiveMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setActiveMonth(today);
    setSelectedDate(getWIBInputDate(today));
  };

  return (
    <main className="request-calendar-page" aria-labelledby="request-calendar-title">
      <section className="calendar-hero">
        <div>
          <h1 id="request-calendar-title">Kalender Request</h1>
          <p>Overview permintaan barang berdasarkan tanggal operasional, status, dan detail harian.</p>
        </div>
        <div className="calendar-toolbar" aria-label="Navigasi bulan kalender">
          <Button type="button" variant="secondary" onClick={goToToday}>
            <RotateCcw size={16} /> Hari Ini
          </Button>
          <div className="calendar-month-switcher">
            <button id="calendar-prev-month" type="button" onClick={() => moveMonth(-1)} aria-label="Bulan sebelumnya">
              <ChevronLeft size={18} />
            </button>
            <strong>{formatMonthTitle(activeMonth)}</strong>
            <button id="calendar-next-month" type="button" onClick={() => moveMonth(1)} aria-label="Bulan berikutnya">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="calendar-summary-grid" aria-label="Ringkasan request bulan aktif">
        <article className="calendar-summary-card total">
          <span>Total Request</span>
          <strong>{summary.total}</strong>
          <small>{formatMonthTitle(activeMonth)}</small>
        </article>
        {(Object.keys(STATUS_META) as Exclude<StatusBucket, 'ALL'>[]).map((key) => (
          <article key={key} className={`calendar-summary-card ${STATUS_META[key].tone}`}>
            <span>{STATUS_META[key].label}</span>
            <strong>{summary[key]}</strong>
            <small>{key === 'PENDING' ? 'Pending + Review' : 'Status bulan ini'}</small>
          </article>
        ))}
      </section>

      <section className="calendar-filter-card">
        <div>
          <h2>Filter Status</h2>
          <p>Pilih status untuk memfokuskan badge dan detail pada kalender.</p>
        </div>
        <div className="calendar-filter-group" role="tablist" aria-label="Filter status request">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              id={`calendar-filter-${item.key.toLowerCase()}`}
              type="button"
              className={filter === item.key ? 'is-active' : ''}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="danger-text" role="alert">{error}</p>}

      <section className="calendar-workspace">
        <div className="calendar-panel">
          <div className="calendar-week-header">
            {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid" aria-busy={loading}>
            {calendarDays.map((day) => {
              const dayRequests = requestsByDate.get(day.key) || [];
              const dayCounts = dayRequests.reduce<Record<string, number>>((acc, request) => {
                const bucket = getStatusBucket(request.status);
                if (bucket) acc[bucket] = (acc[bucket] || 0) + 1;
                return acc;
              }, {});
              const isSelected = selectedDate === day.key;

              return (
                <button
                  key={day.key}
                  type="button"
                  className={`calendar-day ${day.isCurrentMonth ? '' : 'is-muted'} ${day.isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedDate(day.key)}
                >
                  <span className="calendar-day-number">{day.dayNumber}</span>
                  {dayRequests.length > 0 ? (
                    <span className="calendar-day-content">
                      <strong>{dayRequests.length}</strong>
                      <span>request</span>
                    </span>
                  ) : (
                    <span className="calendar-day-empty">—</span>
                  )}
                  <span className="calendar-day-dots" aria-hidden>
                    {(Object.keys(STATUS_META) as Exclude<StatusBucket, 'ALL'>[]).map((key) =>
                      dayCounts[key] ? <i key={key} className={STATUS_META[key].tone}>{dayCounts[key]}</i> : null,
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="calendar-detail-panel" aria-label="Detail request tanggal terpilih">
          <div className="calendar-detail-header">
            <div>
              <span>Detail Harian</span>
              <h2>{formatDateV2(selectedDate)}</h2>
            </div>
            <strong>{selectedRequests.length}</strong>
          </div>

          {loading ? (
            <div className="calendar-request-list" aria-busy="true">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : selectedRequests.length === 0 ? (
            <div className="calendar-empty-state">
              <ClipboardList size={32} />
              <p>Tidak ada request pada tanggal ini untuk filter yang dipilih.</p>
            </div>
          ) : (
            <div className="calendar-request-list">
              {selectedRequests.map((request) => {
                const bucket = getStatusBucket(request.status);
                if (!bucket) return null;
                return (
                  <article key={request.id} className="calendar-request-card">
                    <div>
                      <h3>{request.item}</h3>
                      <p>{request.receiver} • {request.dept || '-'}</p>
                    </div>
                    <span className={`calendar-status-chip ${STATUS_META[bucket].tone}`}>{STATUS_META[bucket].label}</span>
                    <dl>
                      <div><dt>Qty</dt><dd>{request.qty} {request.unit}</dd></div>
                      <div><dt>Tanggal</dt><dd>{formatDateV2(request.date)}</dd></div>
                    </dl>
                    {request.reject_reason && <p className="calendar-reject-reason">Alasan: {request.reject_reason}</p>}
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
};

export default RequestCalendar;
