import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const envSchema = z.object({
  CLIENT_TOKEN: z.string(),
  CLIENT_ID: z.string(),
  NEON_DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  REDIS_TOKEN: z.string()
});

global.dev = process.env.NODE_ENV === 'development';
const devEnvPath = join(process.cwd(), '.dev.env');
const envPath = existsSync(devEnvPath)
  ? devEnvPath
  : join(process.cwd(), '.env');

config({
  path: envPath
});

global.env = envSchema.parse(process.env);
