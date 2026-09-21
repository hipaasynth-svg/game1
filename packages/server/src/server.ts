import { buildApp } from './app.js';
import { createPool } from './db.js';
import { runMigrations } from './migrate.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

await runMigrations(connectionString);

const pool = createPool(connectionString);
const app = buildApp({ pool });

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: '0.0.0.0' });
