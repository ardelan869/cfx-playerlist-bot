import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('Missing NEON_DATABASE_URL');
}

export default defineConfig({
  schema: 'src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL
  }
});
