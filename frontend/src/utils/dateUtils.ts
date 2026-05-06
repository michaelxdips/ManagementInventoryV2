export const APP_TIME_ZONE = 'Asia/Jakarta';

type DateInput = string | Date | null | undefined;

const toDate = (date: DateInput): Date | null => {
    if (!date) return null;
    const parsed = date instanceof Date ? date : new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getWIBInputDate = (date: DateInput = new Date()): string => {
    const parsed = toDate(date);
    if (!parsed) return '';
    return parsed.toLocaleDateString('en-CA', { timeZone: APP_TIME_ZONE });
};

/**
 * Format a date string or Date object to 'DD/MM/YYYY' in WIB.
 * Example: 2026-01-14 -> 14/01/2026
 */
export const formatDateV2 = (date: DateInput): string => {
    const parsed = toDate(date);
    if (!parsed) return '-';

    return parsed.toLocaleDateString('id-ID', {
        timeZone: APP_TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const formatWIBDateTime = (date: DateInput): string => {
    const parsed = toDate(date);
    if (!parsed) return '-';

    return parsed.toLocaleString('id-ID', {
        timeZone: APP_TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};

/**
 * Format date for input field (YYYY-MM-DD) in WIB.
 * Required for <input type="date" /> value.
 */
export const formatInputDate = getWIBInputDate;
