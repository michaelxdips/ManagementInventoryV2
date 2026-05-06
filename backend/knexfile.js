// Knex.js configuration — reads from .env for portability
import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const dbSslEnabled = (process.env.DB_SSL || (isProduction ? 'true' : 'false')).toLowerCase() === 'true';

const connection = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory',
    ...(dbSslEnabled
        ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } }
        : {}),
};

/**
 * @type {import('knex').Knex.Config}
 */
const config = {
    development: {
        client: 'mysql2',
        connection,
        migrations: {
            directory: './src/migrations',
            tableName: 'knex_migrations',
        },
        seeds: {
            directory: './src/seeds',
        },
    },

    production: {
        client: 'mysql2',
        connection,
        migrations: {
            directory: './src/migrations',
            tableName: 'knex_migrations',
        },
        seeds: {
            directory: './src/seeds',
        },
    },
};

export default config;
