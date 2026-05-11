import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

// Load .env.test if NODE_ENV is test, otherwise load .env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_DEV_JWT_SECRET = 'dev-only-inventory-secret-change-me';

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`FATAL: ${name} environment variable is required.`);
  }
  return value;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (isProduction) {
    if (!secret || secret.trim() === '' || secret === 'default-secret-key') {
      throw new Error('FATAL: JWT_SECRET must be set to a strong non-default value in production.');
    }
    if (secret.length < 32) {
      throw new Error('FATAL: JWT_SECRET must be at least 32 characters in production.');
    }
  }
  return secret || DEFAULT_DEV_JWT_SECRET;
};

const parseIntegerEnv = (name, fallback, { min, max } = {}) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`FATAL: ${name} must be a valid integer.`);
  }
  if (min !== undefined && parsed < min) {
    throw new Error(`FATAL: ${name} must be >= ${min}.`);
  }
  if (max !== undefined && parsed > max) {
    throw new Error(`FATAL: ${name} must be <= ${max}.`);
  }
  return parsed;
};

const parseBooleanEnv = (name, fallback = false) => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const normalized = raw.trim().split(/\s+#/, 1)[0].trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`FATAL: ${name} must be a boolean value.`);
};

const buildDbSslConfig = () => {
  const enabled = parseBooleanEnv('DB_SSL', isProduction);
  if (!enabled) return undefined;

  const sslConfig = {
    // FIX-P0-3: Default to true — rejecting unauthorized certs prevents MITM.
    rejectUnauthorized: parseBooleanEnv('DB_SSL_REJECT_UNAUTHORIZED', true),
  };

  // Support Aiven (or any provider) CA certificate via file path or inline PEM.
  const caPath = process.env.DB_SSL_CA_PATH;
  const caInline = process.env.DB_SSL_CA;
  if (caPath) {
    sslConfig.ca = readFileSync(caPath, 'utf-8');
  } else if (caInline) {
    sslConfig.ca = caInline;
  }

  return sslConfig;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: parseIntegerEnv('PORT', 3000, { min: 1, max: 65535 }),
  jwt: {
    secret: getJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    host: requireEnv('DB_HOST'),
    user: requireEnv('DB_USER'),
    password: process.env.DB_PASSWORD || '',
    database: requireEnv('DB_NAME'),
    port: parseIntegerEnv('DB_PORT', 3306, { min: 1, max: 65535 }),
    ssl: buildDbSslConfig(),
    connectionLimit: parseIntegerEnv('DB_CONNECTION_LIMIT', 10, { min: 1, max: 100 }),
    timezone: process.env.DB_TIME_ZONE || '+07:00',
  },
  timeZone: process.env.APP_TIME_ZONE || 'Asia/Jakarta',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimit: {
    windowMs: parseIntegerEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000, { min: 1000 }),
    max: parseIntegerEnv('RATE_LIMIT_MAX', 500, { min: 1 }),
  },
  authRateLimit: {
    windowMs: parseIntegerEnv('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000, { min: 1000 }),
    max: parseIntegerEnv('AUTH_RATE_LIMIT_MAX', 10, { min: 1 }),
  },
  pagination: {
    defaultPerPage: parseIntegerEnv('PAGINATION_DEFAULT_PER_PAGE', 15, { min: 1 }),
    maxPerPage: parseIntegerEnv('PAGINATION_MAX_PER_PAGE', 500, { min: 10 }),
  },
};
