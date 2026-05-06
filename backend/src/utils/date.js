const DEFAULT_TIME_ZONE = 'Asia/Jakarta';

export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || DEFAULT_TIME_ZONE;
export const DB_TIME_ZONE = process.env.DB_TIME_ZONE || '+07:00';

const MYSQL_DATE_TIME_KEYS = new Set([
    'created_at',
    'updated_at',
    'opname_date',
    'read_at',
    'approved_at',
    'rejected_at',
]);

const DATE_ONLY_KEYS = new Set([
    'date',
    'tanggal',
]);

const toDate = (date = new Date()) => new Date(date);

export const getWIBDate = (date = new Date()) => {
    // Returns YYYY-MM-DD in Asia/Jakarta (WIB) timezone.
    // 'en-CA' locale forces YYYY-MM-DD format.
    return toDate(date).toLocaleDateString('en-CA', { timeZone: APP_TIME_ZONE });
};

export const getWIBDateTime = (date = new Date()) => {
    // Stable human-readable WIB timestamp for logs/notifications.
    return toDate(date).toLocaleString('sv-SE', {
        timeZone: APP_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};

export const normalizeDateValueForWIB = (key, value) => {
    if (!(value instanceof Date)) return value;
    if (DATE_ONLY_KEYS.has(String(key))) return getWIBDate(value);
    if (MYSQL_DATE_TIME_KEYS.has(String(key))) return getWIBDateTime(value);
    return getWIBDateTime(value);
};

export const normalizeDatesForWIB = (value, key = '') => {
    if (value instanceof Date) return normalizeDateValueForWIB(key, value);
    if (Array.isArray(value)) return value.map((item) => normalizeDatesForWIB(item, key));
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([entryKey, entryValue]) => [
                entryKey,
                normalizeDatesForWIB(entryValue, entryKey),
            ])
        );
    }
    return value;
};
